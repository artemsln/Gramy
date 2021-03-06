import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import * as CanvasJS from '../../CanvasJS.js';
import { Chart, ChartDataPoint } from 'canvasjs';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';


@IonicPage()
@Component({
  selector: 'page-chart',
  templateUrl: 'chart.html',
})
export class ChartPage {

  userId: string;
  private chart: Chart;

  private systolicPressureDataPoints: Array<ChartDataPoint>;
  private diastolicPressureDataPoints: Array<ChartDataPoint>;
  private pulseDataPoints: Array<ChartDataPoint>;

  constructor(public navCtrl: NavController, public navParams: NavParams,
    private afDatabase: AngularFireDatabase, private afAuth: AngularFireAuth,
    private alertCtrl: AlertController) {

    try {
      this.afAuth.authState.subscribe(data => {
        if (data.email && data.uid) {
          this.userId = data.uid;
          console.log('logged in measure actv: ' + data);
        } else {
          console.log('should do something to get rid of the user! He is not logged in!');
        }
      });
    } catch (e) {
      console.log('could not get userId' + e)
    }
  }

  ionViewDidLoad() {

    this.renderChart();
  }

  private renderChart(): void {
    this.systolicPressureDataPoints = new Array<ChartDataPoint>();
    this.diastolicPressureDataPoints = new Array<ChartDataPoint>();
    this.pulseDataPoints = new Array<ChartDataPoint>();

    this.afDatabase.database.ref(`measures/${this.userId}`).orderByChild('date').limitToLast(7).once('value')
      .then(response => {
        if (response) {
          if (response.numChildren() < 1) {
            this.raiseWarning('Enter measurement data.');
            return;
          }
          this.mapDatabaseResponse(response);
          this.InitChart();
        } else {
          this.raiseWarning();
        }
      }).catch(error => {
        console.log(error);
        this.raiseWarning('Internal error.');
      });
  }



  private mapDatabaseResponse(measurements): void {
    measurements.forEach(measurementItem => {
      let measurement = measurementItem.val();
      let measureDate = new Date(measurement.date);

      this.systolicPressureDataPoints.push(<ChartDataPoint>{ x: measureDate, y: Number(measurement.systolic_pressure) });
      this.diastolicPressureDataPoints.push(<ChartDataPoint>{ x: measureDate, y: Number(measurement.diastolic_pressure) });
      this.pulseDataPoints.push(<ChartDataPoint>{ x: measureDate, y: Number(measurement.pulse) });
    });
  }

  private InitChart(): void {
    this.chart = new CanvasJS.Chart("chartContainer", {
      title: {
        text: "Daily statistics"
      },
      axisY: [{
        title: "Pressure",
        lineColor: "#C24642",
        tickColor: "#C24642",
        labelFontColor: "#C24642",
        titleFontColor: "#C24642",
        suffix: "mmHg"
      }],
      axisY2: {
        title: "Pulse (Heart rate)",
        lineColor: "#7F6084",
        tickColor: "#7F6084",
        labelFontColor: "#7F6084",
        titleFontColor: "#7F6084",
        suffix: "/min"
      },
      axisX: {
        valueFormatString: "DD-MM-YY HH:mm"
      },
      toolTip: {
        shared: true
      },
      legend: {
        cursor: "pointer",
        itemclick: this.toggleDataSeries
      },
      data: [{
        type: "line",
        name: "Systolic pressure",
        color: "#369EAD",
        showInLegend: true,
        axisYIndex: 0,
        dataPoints: this.systolicPressureDataPoints
      },
      {
        type: "line",
        name: "Diastolic pressure",
        color: "#C24642",
        axisYIndex: 0,
        showInLegend: true,
        dataPoints: this.diastolicPressureDataPoints
      },
      {
        type: "line",
        name: "Pulse",
        color: "#7F6084",
        axisYType: "secondary",
        showInLegend: true,
        dataPoints: this.pulseDataPoints
      }]
    });

    this.chart.render();
  }

  private toggleDataSeries(e) {
    if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
      e.dataSeries.visible = false;
    } else {
      e.dataSeries.visible = true;
    }
    e.chart.render();
  }

  private raiseWarning(subTitle : string = null) {
    let alert = this.alertCtrl.create({
      title: 'No data to present!',
      subTitle: subTitle,
      buttons: ['Ok']
    });
    alert.present();
  }



}
