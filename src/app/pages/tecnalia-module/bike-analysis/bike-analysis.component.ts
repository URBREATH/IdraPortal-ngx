import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSliderModule } from '@angular/material/slider';
import * as L from 'leaflet';
import { Chart } from 'chart.js';
import { ConfigService } from '@ngx-config/core';
import { GetCalendarService } from '../services/get-calendar.service';
import { GetMeteoService } from '../services/get-meteo.service';
import { PutVoronoiService } from '../services/put-voronoi.service';
import { GetBikemodelsService } from '../services/get-bikemodels.service';
import { GetBikedataService } from '../services/get-bikedata.service';
import { CreateNewbikemodelService } from '../services/create-newbikemodel.service';
import { GetOdmatrixService } from '../services/get-odmatrix.service';
import { GetOdmatrixcustomService } from '../services/get-odmatrixcustom.service';
import { max } from 'rxjs/operators';

@Component({
  selector: 'ngx-bike-analysis',
  templateUrl: './bike-analysis.component.html',
  styleUrls: ['./bike-analysis.component.scss']
})

export class BikeAnalysisComponent implements OnInit {
  constructor(
    private getCalendarService: GetCalendarService,
    private getMeteoService: GetMeteoService,
    private putVoronoiService: PutVoronoiService,
    private getBikemodelsService: GetBikemodelsService,
    private getBikedataService: GetBikedataService,
    private createNewbikemodelService: CreateNewbikemodelService,
    private getOdmatrixService: GetOdmatrixService,
    private getOdmatrixcustomService: GetOdmatrixcustomService,
    configService: ConfigService, private http: HttpClient
  ) { this.apiURL = configService.getSettings("bike_analysis_api_base_url"); }


  private apiURL: any;
  private chart: any = null;
  private chart_config: any = {}
  private od_chart: any = null;
  private od_chart_config: any = {}

  private dateS = null;
  private intensidadJA: any = {};
  private temperaturaJA: any = {};
  private calendarInfo: any = {};
  private city: string = "0";
  private map: L.Map;

  private static BIO_LON: number = -2.9356732032001926;
  private static BIO_LAT: number = 43.26201529732467;

  private static AMS_LON: number = 4.895325492686641;
  private static AMS_LAT: number = 52.375147927015995;

  private static HEL_LON: number = 24.925176054721625;
  private static HEL_LAT: number = 60.22470512386342;

  private static MES_LON: number = 15.553426081599502;
  private static MES_LAT: number = 38.18445422457372;

  private marker: any = null;
  public nfecha: Date = new Date();
  public ofecha: Date = new Date();
  public sfecha: Date = new Date();
  public fecha: Date = new Date();
  //public lfecha:Date = new Date();
  public rfecha: Date = new Date();
  public rDate: Date = new Date();
  public lDate: Date = new Date();

  private areas: any = null;
  private points: any = null;
  private markers: any[] = [];
  private globalIniTime: any = null;
  private globalEndTime: any = null;

  private mats: any[];
  private ts: any[];
  private xs: any[];
  private ys: any[];
  private mm_series: any;
  private ele_series: any[];
  private selected_key: any;
  private containerNode: HTMLCanvasElement = null;
  public slider_max:number = 24;
  public slider_val:number = 0;

  options = {
    layers: [
      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' }),
    ],
    zoom: 12,
    center: L.latLng({ lat: 43.26201529732467, lng: -2.9356732032001926 }),
  };

  onMapReady(map: L.Map) {
    this.map = map;
    setTimeout(() => { }, 50);
    this.changeCity();
  }

  ngOnInit(): void {
    Chart.defaults.stripe = Chart.helpers.clone(Chart.defaults.line);
    Chart.controllers.stripe = Chart.controllers.line.extend({
      draw: function (ease: any) {
        var result = Chart.controllers.line.prototype.draw.apply(this, arguments);

        // don't render the stripes till we've finished animating
        if (!this.rendered && ease !== 1)
          return;
        this.rendered = true;


        var helpers = Chart.helpers;
        var meta = this.getMeta();
        var yScale = this.getScaleForId(meta.yAxisID);
        var yScaleZeroPixel = yScale.getPixelForValue(0);
        var widths = this.getDataset().width;
        var ctx = this.chart.chart.ctx;

        ctx.save();
        ctx.fillStyle = this.getDataset().backgroundColor;
        ctx.lineWidth = 1;
        ctx.beginPath();

        // initialize the data and bezier control points for the top of the stripe
        helpers.each(meta.data, function (point: any, index: any) {
          point._view.y += (yScale.getPixelForValue(widths[index]) - yScaleZeroPixel);
        });
        Chart.controllers.line.prototype.updateBezierControlPoints.apply(this);

        // draw the top of the stripe
        helpers.each(meta.data, function (point: any, index: number) {
          if (index === 0)
            ctx.moveTo(point._view.x, point._view.y);
          else {
            var previous = helpers.previousItem(meta.data, index);
            var next = helpers.nextItem(meta.data, index);
            helpers.canvas.lineTo(ctx, previous._view, point._view);
            /*
            Chart['elements'].Line.prototype.lineTo.apply({
              _chart: {
                ctx: ctx
              }
            }, [previous, point, next, null, null])*/
          }
        });

        // revert the data for the top of the stripe
        // initialize the data and bezier control points for the bottom of the stripe
        helpers.each(meta.data, function (point, index) {
          point._view.y -= 2 * (yScale.getPixelForValue(widths[index]) - yScaleZeroPixel);
        });
        // we are drawing the points in the reverse direction
        meta.data.reverse();
        Chart.controllers.line.prototype.updateBezierControlPoints.apply(this);

        // draw the bottom of the stripe
        helpers.each(meta.data, function (point: any, index: number) {
          if (index === 0)
            ctx.lineTo(point._view.x, point._view.y);
          else {
            var previous = helpers.previousItem(meta.data, index);
            var next = helpers.nextItem(meta.data, index);
            /*
            Chart['elements'].Line.prototype.lineTo.apply({
              _chart: {
                ctx: ctx
              } 
            }, [previous, point, next, null, null])*/
            helpers.canvas.lineTo(ctx, previous._view, point._view);
          }

        });

        // revert the data for the bottom of the stripe
        meta.data.reverse();
        helpers.each(meta.data, function (point, index) {
          point._view.y += (yScale.getPixelForValue(widths[index]) - yScaleZeroPixel);
        });
        Chart.controllers.line.prototype.updateBezierControlPoints.apply(this);

        ctx.stroke();
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        return result;
      }
    });
    let mtable: HTMLTableElement = <HTMLTableElement>document.getElementById("models_table");
    //mtable.onclick = function (e) {

    this.containerNode = <HTMLCanvasElement>document.getElementById("container_canvas");
  }

  clickModelTable(e:any){ 
    console.log('mtable clicked...');
    let ttable: HTMLTableElement = <HTMLTableElement>document.getElementById("models_table");
    for (let i = 0; i < ttable.rows.length; i++) {
      let row = ttable.rows[i];
      for (let j = 0; j < row.cells.length; j++) {
        let ccell = row.cells[j];
        ccell.style.backgroundColor = "white";
        ccell.style.border = 'solid';
        ccell.style.borderWidth = '1px';
      }
    }
    let et: HTMLElement = <HTMLElement> e.target;
    let row: HTMLTableRowElement = <HTMLTableRowElement>et.parentNode;
    for (let j = 0; j < row.cells.length; j++) {
      let ccell = row.cells[j];
      ccell.style.backgroundColor = "#FED8B1";
      ccell.style.border = 'solid';
      ccell.style.borderWidth = '1px';
    }
    let firstRow = ttable.rows[0];
    for (let j = 0; j < firstRow.cells.length; j++) {
      let ccell = firstRow.cells[j];
      ccell.style.backgroundColor = "white";
      ccell.style.border = 'solid';
      ccell.style.borderWidth = '1px';
    }
  }

  changeCity(): void {
    let e = (document.getElementById("cityComboBox")) as HTMLSelectElement;
    let sel = e.selectedIndex;
    let opt = e.options[sel];
    this.city = (<HTMLOptionElement>opt).value;
    let llat = 0;
    let llon = 0;
    let lzoom = 12;

    if (this.city === "0") {
      llat = BikeAnalysisComponent.BIO_LAT;
      llon = BikeAnalysisComponent.BIO_LON;
    }
    else if (this.city === "1") {
      llat = BikeAnalysisComponent.AMS_LAT;
      llon = BikeAnalysisComponent.AMS_LON;
    }
    else if (this.city === "2") {
      llat = BikeAnalysisComponent.HEL_LAT;
      llon = BikeAnalysisComponent.HEL_LON;
      lzoom = 11;
    }
    else if (this.city === "3") {
      llat = BikeAnalysisComponent.MES_LAT;
      llon = BikeAnalysisComponent.MES_LON;
      lzoom = 13;
    }
    if (this.marker !== null) this.marker.setMap(null);
    let center: L.LatLng = L.latLng({ lat: llat, lng: llon });
    console.log("changeCity::: myLatLng=" + JSON.stringify(center) + " zoom=" + lzoom);
    console.log("changeCity::: this.map=" + this.map);
    this.map.flyTo(center, lzoom);
    console.log("myLatLng=" + JSON.stringify(center) + " zoom=" + lzoom);
    this.getBikeModels0();
  }

  getCalendarData() {
    console.log('219:bikes:getCalendarData()::: this.city=' + this.city);
    this.getCalendarService.getValues(this.city).subscribe(res => this.createCalendar0(res), err => console.log(err));
  }

  createCalendar0(data: any) {
    this.calendarInfo = data;
    this.createCalendar(this.fecha);
    this.getMeteoData0();
  }

  getMeteoData0() {
    this.getMeteoService.getValues(this.city).subscribe(res => this.getMeteoData(res), err => console.log(err));
  }

  getMeteoData(data: any) {
    this.temperaturaJA = data['temps'];
    this.intensidadJA = data['precps'];
    this.getBikeData0();
  }

  getBikeData0() {
    this.getBikedataService.getValues(this.city).subscribe(res => this.getBikeData(res), err => console.log(err));
  }

  getBikeData(bikeData: any[]) {
    let iniTs = bikeData[0][0];
    var ini = new Date(iniTs);
    let endTs = bikeData[bikeData.length - 1][0];
    var end = new Date(endTs);
    this.globalIniTime = this.lformatDate(ini);
    this.globalEndTime = this.lformatDate(end);
    /*
    document.getElementById('iniNM').innerHTML = 
    document.getElementById('endNM').innerHTML = this.lformatDate(end);
    let ttable:HTMLTableElement = <HTMLTableElement> document.getElementById('stats_table');
    ttable.rows[2].cells[1].innerHTML = this.lformatDate(ini);
    ttable.rows[3].cells[1].innerHTML = this.lformatDate(end);*/

    console.log('ini=' + ini);
    console.log('end=' + end);
    this.printBikeData(bikeData);
  }

  printBikeData(data: any[]) {
    console.log("bike_data.js.printBikeData:::  data.length=" + data.length);
    console.log("bike_data.js.printBikeData:::    data[0][0] =" + new Date(data[0][0]));
    console.log("bike_data.js.printBikeData::: data[data.length-1][0] =" + new Date(data[data.length - 1][0]));
    let xs = [];
    let ys = [];
    let bikes = [];
    let temps = [];
    let precs = [];
    let max_x = data[data.length - 1][0];
    let min_x = data[0][0];
    for (let k = 0; k < data.length; k++) {
      xs.push(data[k][0]);
      ys.push(data[k][1]);
      bikes.push({ x: data[k][0], y: data[k][1] });
    }
    for (let k = 0; k < this.temperaturaJA.length; k++) {
      if (this.temperaturaJA[k][0] > min_x && this.temperaturaJA[k][0] < max_x) {
        temps.push({ x: this.temperaturaJA[k][0], y: this.temperaturaJA[k][1] });
      }
    }
    for (let k = 0; k < this.intensidadJA.length; k++) {
      if (this.intensidadJA[k][0] > min_x && this.intensidadJA[k][0] < max_x) {
        precs.push({ x: this.intensidadJA[k][0], y: this.intensidadJA[k][1] });
      }
    }

    let chart_config: any = {
      type: 'line',
      data: {
        labels: xs,
        datasets: [
          {
            label: 'Bike Trips',
            backgroundColor: 'rgb(0, 0, 255)',
            type: 'line',
            borderColor: 'rgb(0, 0, 255)',
            borderWidth: 0.1,
            pointRadius: 0,
            yAxisID: 'y-axis-1',
            data: bikes
          },
          {
            label: 'Temperature',
            backgroundColor: 'rgb(255, 0, 0)',
            type: 'line',
            borderColor: 'rgb(255, 0, 0)',
            borderWidth: 0.1,
            pointRadius: 0,
            borderDash: [10, 5],
            yAxisID: 'y-axis-2',
            data: temps
          },
          {
            label: 'Precipitation',
            type: 'bar',
            backgroundColor: 'rgb(0, 255, 255)',
            borderColor: 'rgb(0, 255, 255)',
            yAxisID: 'y-axis-3',
            data: precs
          }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [
            {
              id: 'y-axis-1',
              scaleLabel: {
                display: true,
                labelString: '# Trips'
              },
              type: 'linear',
              display: true,
              position: 'right',
              gridlines: { display: true },
              labels: { show: true },
              ticks: { beginAtZero: true }
            },
            {
              id: 'y-axis-2',
              scaleLabel: {
                display: true,
                labelString: 'Temp (°C)'
              },
              type: 'linear',
              display: true,
              position: 'right',
              gridlines: { display: false },
              labels: { show: true }
            },
            {
              id: 'y-axis-3',
              scaleLabel: {
                display: true,
                labelString: 'Prec. mm'
              },
              type: 'linear',
              display: true,
              position: 'right',
              gridlines: { display: false },
              labels: { show: true }
            }],
          xAxes: [{
            type: 'time',
            time: {
              max: data[data.length - 1][0],
              min: data[0][0],
              // unit: 'millisecond',
              displayFormats: {
                'millisecond': 'DD-MM-YY',
                'second': 'DD-MM-YY',
                'minute': 'DD-MM-YY',
                'hour': 'DD-MM-YY',
                'day': 'DD-MM-YY',
                'week': 'DD-MM-YY',
                'month': 'DD-MM-YY',
                'quarter': 'DD-MM-YY',
                'year': 'DD-MM-YY'
              }
            }
          }]
        },
        pan: {
          enabled: true,
          mode: 'x',
          speed: 1
        },
        zoom: {
          enabled: true,
          mode: 'x',
          speed: 100
        }
      }
    };

    if (this.chart !== null) { try { this.chart.destroy(); } catch (err) { console.log('181:bike_data:::' + err); } }
    if (this.od_chart !== null) { try { this.od_chart.destroy(); } catch (err) { console.log('182:bike_data:::' + err); } }
    let ctx: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("container_canvas");
    this.chart = new Chart(
      ctx,
      chart_config
    );
  }

  evaluate() {
    // this.getValues()
  }

  ////////////////////////////////////////////////////////////////////////
  // calendar
  ////////////////////////////////////////////////////////////////////////
  monthToWord(val: number) {
    var lmonth = [];
    lmonth[0] = "January";
    lmonth[1] = "February";
    lmonth[2] = "March";
    lmonth[3] = "April";
    lmonth[4] = "May";
    lmonth[5] = "June";
    lmonth[6] = "July";
    lmonth[7] = "August";
    lmonth[8] = "September";
    lmonth[9] = "October";
    lmonth[10] = "November";
    lmonth[11] = "December";
    return lmonth[val];
  }

  populateYearCB(yyear: number) {
    var mItem: HTMLOptionElement = <HTMLOptionElement>document.createElement("option");
    let ySel: HTMLSelectElement = <HTMLSelectElement>document.getElementById("yCBI");
    mItem.text = "2016";
    mItem.value = 2016 + "";
    ySel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "2017";
    mItem.value = 2017 + "";
    ySel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "2018";
    mItem.value = 2018 + "";
    ySel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "2019";
    mItem.value = 2019 + "";
    ySel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "2020";
    mItem.value = 2020 + "";
    ySel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "2021";
    mItem.value = 2021 + "";
    ySel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "2022";
    mItem.value = 2022 + "";
    ySel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "2023";
    mItem.value = 2023 + "";
    ySel.options.add(mItem);
    var idx = 0;
    if (yyear === 2016) { idx = 0; }
    else if (yyear === 2017) { idx = 1; }
    else if (yyear === 2018) { idx = 2; }
    else if (yyear === 2019) { idx = 3; }
    else if (yyear === 2020) { idx = 4; }
    else if (yyear === 2021) { idx = 5; }
    else if (yyear === 2022) { idx = 6; }
    else if (yyear === 2023) { idx = 7; }

    ySel.selectedIndex = idx;
    /*
    ySel.addEventListener("change",function(e) {
        var yyIdx = ySel.selectedIndex;
        var yy = 2021;
        if      ( yyIdx === 0 ){ yy = 2016; }
        else if ( yyIdx === 1 ){ yy = 2017; }
        else if ( yyIdx === 2 ){ yy = 2018; }
        else if ( yyIdx === 3 ){ yy = 2019; }
        else if ( yyIdx === 4 ){ yy = 2020; }
        else if ( yyIdx === 5 ){ yy = 2021; }
        else if ( yyIdx === 6 ){ yy = 2022; }
        else if ( yyIdx === 7 ){ yy = 2023; }
        
        let mSel:HTMLSelectElement = <HTMLSelectElement> document.getElementById("mCBI");
        let mm = mSel.selectedIndex;
        nfecha:Date = new Date(yy,mm,1);
        //console.log("populateYearCB::: nfecha="+nfecha+" sfecha="+sfecha);
        this.createCalendar(nfecha);
    });*/
  }

  populateMonthCB(yyear: number, monthI: number) {
    var mItem: HTMLOptionElement = <HTMLOptionElement>document.createElement("option");
    let mSel: HTMLSelectElement = <HTMLSelectElement>document.getElementById("mCBI");
    mItem.text = "January";
    mItem.value = 0 + "";
    mSel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "February";
    mItem.value = 1 + "";
    mSel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "March";
    mItem.value = 2 + "";
    mSel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "April";
    mItem.value = 3 + "";
    mSel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "May";
    mItem.value = 4 + "";
    mSel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "June";
    mItem.value = 5 + "";
    mSel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "July";
    mItem.value = 6 + "";
    mSel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "August";
    mItem.value = 7 + "";
    mSel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "September";
    mItem.value = 8 + "";
    mSel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "October";
    mItem.value = 9 + "";
    mSel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "November";
    mItem.value = 10 + "";
    mSel.options.add(mItem);
    var mItem = document.createElement("option");
    mItem.text = "December";
    mItem.value = 11 + "";
    mSel.options.add(mItem);
    mSel.selectedIndex = monthI - 1;
    /*
    mSel.addEventListener("change",function(e) {
        var mm = mSel.selectedIndex;
        var nfecha = new Date(yyear,mm,1);
        console.log("populateYearCB::: nfecha="+nfecha+" sfecha="+sfecha);
        createCalendar(nfecha);
    }); */
  }

  findMaxDaysInMonth(ofecha: Date) {
    var temp: Date = new Date(ofecha);
    var nowMonth = ofecha.getMonth();
    var lastDay = temp.getDate();
    for (var j = 1; j < 32; j++) {
      temp.setDate(temp.getDate() + 1);
      var lMonth = temp.getMonth();
      if (lMonth !== nowMonth) { break; }
      lastDay = temp.getDate();
    }
    return lastDay + 1;
  }

  findNumOfEmptyDays(ofecha: Date) {
    var temp = new Date(ofecha);
    temp.setDate(1);
    var out = temp.getDay() - 1;
    if (temp.getDay() === 0) out = 6;
    return out;

  }

  createCalendar(local_fecha: Date) {
    console.log('calendar.js.createCalendar::: local_fecha=' + local_fecha);
    this.sfecha = local_fecha;
    //console.log('calendar.js.createCalendar::: calendarInfo='+calendarInfo);
    document.getElementById("calendar").innerHTML = '';
    var btn: HTMLDivElement = <HTMLDivElement>document.createElement("div");
    btn.style.boxSizing = "border-box";
    btn.style.fontFamily = "Verdana, sans-serinf";
    //btn.className        = "month";
    //btn.style.position   = 'absolute';
    btn.style.width = "100%";
    btn.style.background = '#cfb391';
    btn.style.border = '0px';
    btn.style.boxSizing = 'border-box';
    btn.style.marginTop = '-16px';
    var monthI = local_fecha.getMonth() + 1;
    var month = this.monthToWord(local_fecha.getMonth());
    var maxDaysMonth = this.findMaxDaysInMonth(local_fecha);
    var edays = this.findNumOfEmptyDays(local_fecha);
    console.log('linea 735: local_fecha=\t' + local_fecha);
    var temp: Date = new Date(local_fecha);
    this.lDate = new Date(temp.setMonth(temp.getMonth() - 1));
    console.log('linea 738:       lDate=\t' + this.lDate);
    temp = new Date(local_fecha);
    this.rDate = new Date(temp.setMonth(temp.getMonth() + 1));
    console.log('linea 741:       rDate=\t' + this.rDate);
    var year = local_fecha.getFullYear();
    btn.innerHTML = "<ul id=\"parentUL\" style=\"height:100%;box-sizing:border-box;display:block;text-align:center\"><li id=\"prev\" style=\"padding-top:3px;list-style:none;float:left;\" class=\"prev\">&#10094;</li><li id=\"next\" style=\"list-style:none;float:right;padding-top:3px\" class=\"next\">&#10095;</li>";
    btn.innerHTML = btn.innerHTML + "<li style=\"text-align:center;display:block\"><select style=\"margin-left:-40px;\" id=\"mCBI\"></select><br><span style=\"font-size:18;px\"><select id=\"yCBI\"></select></span> </li></ul>";
    // week
    var weekBtn: HTMLUListElement = <HTMLUListElement>document.createElement("ul");
    weekBtn.className = "weekdays";
    weekBtn.style.color = 'rgb(102,102,102)';
    weekBtn.style.backgroundColor = '#ddd';
    weekBtn.style.margin = '0px';
    weekBtn.style.padding = '0px';
    weekBtn.style.fontSize = '13px';
    weekBtn.style.listStyle = 'disc';
    weekBtn.style.verticalAlign = 'baseline';
    weekBtn.style.boxSizing = 'border-box';
    weekBtn.style.paddingInlineStart = '40px';
    weekBtn.style.paddingInlineEnd = '40px';
    weekBtn.style.paddingLeft = '58px';
    weekBtn.innerHTML = "  <li style=\"display:inline-block;text-transform:uppercase;color:#666;width: 14.1%;\">Mo</li><li style=\"display:inline-block;text-transform:uppercase;color:#666;width:14.1%;\">Tu</li><li style=\"display:inline-block;text-transform:uppercase;color:#666;width:14.6%;\">We</li><li style=\"display:inline-block;text-transform:uppercase;color:#666;width:14.1%;\">Th</li><li style=\"display:inline-block;text-transform:uppercase;color:#666;width:14.1%;\">Fr</li><li style=\"display:inline-block;text-transform:uppercase;color:#666;width:14.1%;\">Sa</li><li style=\"display:inline-block;text-transform:uppercase;color:#666;width:14.1%;\">Su</li>";
    // weekBtn.style.display = "inline-block";
    weekBtn.style.color = "#666";
    btn.appendChild(weekBtn);
    // days
    var daysBtn: HTMLUListElement = <HTMLUListElement>document.createElement("ul");
    daysBtn.className = "days";
    daysBtn.style.padding = "2px";
    daysBtn.style.display = 'block';
    daysBtn.style.verticalAlign = 'baseline';
    daysBtn.style.background = "rgb(238,238,238)";
    daysBtn.style.fontSize = '13px';
    daysBtn.style.listStyleType = "none";
    daysBtn.style.color = "#58595b";

    //daysBtn.style.margin = '0px';
    /*
    daysBtn.style.marginBlockStart = '1em';
    daysBtn.style.marginBlockEnd = '1em';
    daysBtn.style.marginInlineStart = '0px';
    daysBtn.style.marginInlineEnd = '0px';
    daysBtn.style.color = '#58595b';*/
    daysBtn.style.paddingInlineStart = '40px';
    daysBtn.innerHTML = "";
    daysBtn.id = "daysUL";
    daysBtn.style.width = '100%'
    var llimit = 32;
    for (var i = 0; i < edays; i++) {
      var dayBtn = document.createElement("li");
      dayBtn.style.width = '12.6%';
      dayBtn.style.listStyleType = "none";
      dayBtn.style.color = "#777";
      dayBtn.style.marginBottom = '5px';
      dayBtn.style.fontSize = '100%';
      dayBtn.style.margin = '0';
      dayBtn.style.outline = '0';
      dayBtn.style.boxSizing = 'border-box';
      dayBtn.style.lineHeight = '1.35';
      //dayBtn.style.position='relative';
      dayBtn.style.listStyleType = "none";
      dayBtn.style.display = "inline-block";
      dayBtn.style.textAlign = "center";
      dayBtn.style.listStyle = 'disc';
      dayBtn.style.verticalAlign = 'baseline';
      dayBtn.id = -i + "";
      daysBtn.append(dayBtn);

    }
    for (var i = 1; i < maxDaysMonth; i++) {
      var dayBtn = document.createElement("li");
      dayBtn.style.width = '12.6%'
      dayBtn.style.listStyleType = "none";
      dayBtn.style.color = "#777";
      dayBtn.style.marginBottom = '5px';
      dayBtn.style.fontSize = '100%';
      dayBtn.style.margin = '0';
      dayBtn.style.outline = '0';
      dayBtn.style.boxSizing = 'border-box';
      dayBtn.style.lineHeight = '1.35';
      //dayBtn.style.position='relative';
      dayBtn.style.listStyleType = "none";
      dayBtn.style.display = "inline-block";
      dayBtn.style.textAlign = "center";
      dayBtn.style.listStyle = 'disc';
      dayBtn.style.verticalAlign = 'baseline';
      /*dayBtn.style.color="#777";
      dayBtn.style.listStyleType = "none";
      dayBtn.style.display = "inline-block";
      dayBtn.style.textAlign = "center"; */
      dayBtn.id = i + "";
      if (i === this.sfecha.getDate() && (monthI - 1) === this.sfecha.getMonth() && year === this.sfecha.getFullYear()) {
        dayBtn.style.padding = '5px';
        /*background: #cfb391;*/
        dayBtn.style.border = 'solid';
        dayBtn.style.color = 'blue !important';

        dayBtn.className = "active";
        var sp: HTMLSpanElement = <HTMLSpanElement>document.createElement("span");
        sp.className = "active";
        sp.innerHTML = i + "";
        dayBtn.appendChild(sp);
      } else {
        dayBtn.innerHTML = i + "";
      }
      var mI = monthI + "";
      if (monthI < 10) mI = '0' + monthI;
      var iI = i + '';
      if (i < 10) iI = '0' + i;
      var dd = year + "-" + mI + "-" + iI;

      if (this.calendarInfo !== null) {
        if (dd in this.calendarInfo) {

          if (this.calendarInfo[dd]["lect"] === 0) {
            dayBtn.style.backgroundColor = "#0f0";
          }
          if (this.calendarInfo[dd]["fest"] === 1) {
            dayBtn.style.backgroundColor = "#f00";
          }
          else if (this.calendarInfo[dd]["fest"] === 2) {
            dayBtn.style.backgroundColor = "#f0f";
          }
          else if (this.calendarInfo[dd]["fest"] === 3) {
            dayBtn.style.backgroundColor = "#ff0";
          }
          //console.log("dd="+dd+"\tcalendarInfo[dd]="+JSON.stringify(calendarInfo[dd]));
          /*if ( this.calendarInfo[dd] !== "" ){
                dayBtn.className = "tooltip";
                var sp2 = document.createElement("span");
                sp2.className = "tooltiptext";
                sp2.innerHTML = this.calendarInfo[dd]["text"];
                dayBtn.appendChild(sp2);       
          }else{
                dayBtn.className = "";
          }    */
        } else {
          /*
          console.log('dd='+dd+ ' is NOT IN caledarInfo');
          dayBtn.style.backgroundColor="#fff";
          dayBtn.className = "tooltip";
          var sp2:HTMLSpanElement =<HTMLSpanElement> document.createElement("span");
          sp2.className = "tooltiptext";
          sp2.innerHTML = "";
          dayBtn.appendChild(sp2);    */
        }
      }
      daysBtn.append(dayBtn);
    }
    btn.appendChild(daysBtn);
    document.getElementById("calendar").appendChild(btn);

    document.getElementById("parentUL")['component'] = this;
    document.getElementById("parentUL").addEventListener("click", function (e) {
      let targ: HTMLLIElement = <HTMLLIElement>e.target;
      if (targ && targ.nodeName === "LI") {
        if (targ.id === "prev") {
          this['component'].createCalendar(this['component'].lDate);
        }
        else if (targ.id === "next") {
          this['component'].createCalendar(this['component'].rDate);
        }
      }
    });

    document.getElementById("daysUL")['component'] = this;
    document.getElementById("daysUL").addEventListener("click", function (e) {
      let targ: HTMLLIElement = <HTMLLIElement>e.target;
      if (targ && targ.nodeName === "LI") {
        if (+targ.id > 0) {
          this['component'].sfecha = new Date(local_fecha.setDate(+targ.id));
          //changeChartZoomAndDate();
          this['component'].createCalendar(local_fecha);
        }
      }
    });
    this.populateMonthCB(year, monthI);
    this.populateYearCB(year);
  }

  lformatDate(local_date: Date) {
    //var d = new Date(date),
    let month: string = '' + (local_date.getMonth() + 1);
    let day: string = '' + local_date.getDate();
    let year: string = '' + local_date.getFullYear();

    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;
    let out = [year, month, day].join('-');
    return out;
  }

  lformatDateTime(datetime: Date) {
    //var d = new Date(date),
    let month = '' + (datetime.getMonth() + 1);
    let day = '' + datetime.getDate();
    let year = datetime.getFullYear();

    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;
    let out = [year, month, day].join('-');
    //console.log('espiras.js.lformatDate::: in='+date+" out="+out);

    out = out + " " +
      ("0" + datetime.getUTCHours()).slice(-2) + ":" +
      ("0" + datetime.getUTCMinutes()).slice(-2);
    return out;
  }

  ///////////////////////////////////////////////////////////////////////////
  openNewModelModal() {

    //let ttable: HTMLTableElement = <HTMLTableElement>document.getElementById("stats_table");
    document.getElementById('cityNM').innerHTML = this.city;
    //document.getElementById('idNM').innerHTML = this.globalEndTime;
    let ini: HTMLSelectElement = <HTMLSelectElement>document.getElementById('iniNM');
    let end: HTMLSelectElement = <HTMLSelectElement>document.getElementById('endNM');
    let delta: HTMLSelectElement = <HTMLSelectElement>document.getElementById('deltaNM');
    ini.value = this.globalIniTime;
    end.value = this.globalEndTime;
    delta.value = '60';
    document.getElementById('createModelModal').style.display = 'block';
  }
  closeNewModelModal(res: any) {
    console.log('closeNewModelModal:::' + res);
    document.getElementById('createModelModal').style.display = 'none';
  }

  createNewModel() {
    console.log('bikes.js.createNewModel()::: in function');
    //let id = document.getElementById('idNM').innerHTML;
    let typeS: HTMLSelectElement = <HTMLSelectElement>document.getElementById('typeNM');
    let type = typeS.value;
    let numS: HTMLSelectElement = <HTMLSelectElement>document.getElementById('numNM');
    let num: number = +numS.value;
    let iniS: HTMLSelectElement = <HTMLSelectElement>document.getElementById('iniNM');
    let ini_date = iniS.value;
    let endS: HTMLSelectElement = <HTMLSelectElement>document.getElementById('endNM');
    let end_date = endS.value;
    let deltaS: HTMLSelectElement = <HTMLSelectElement>document.getElementById('deltaNM');
    let delta = deltaS.value;
    console.log('bikes.js.createNewModel():::\t    type=\t' + type);
    console.log('bikes.js.createNewModel():::\t     num=\t' + num);
    console.log('bikes.js.createNewModel():::\tini_date=\t' + ini_date);
    console.log('bikes.js.createNewModel():::\tend_date=\t' + end_date);
    console.log('bikes.js.createNewModel():::\t   delta=\t' + delta);
    let polys = document.getElementById('inputAreasID').nodeValue;
    this.createNewbikemodelService.createModel(this.city, type, num, ini_date, end_date, +delta, polys).subscribe(res => this.closeNewModelModal(res), err => console.log(err));
  }
  odMatrix(period: number) {
    console.log('657:bikes.ts:odMatrix::: period=' + period);
    let model_id = this.getSelectedModel();
    let num = this.getSelectedNum();
    let num_areas = this.getSelectedNumAreas();
    let inf_type = this.getSelectedType();
    let delta = this.getSelectedDeltaT();
    let dateS = this.lformatDate(this.sfecha);
    // (city:string, inference_type:number, num_areas:number, model_id:string,dateS:string,period:number,num:number,delta_t:number)
    this.getOdmatrixService.getMatrix(this.city, +inf_type, +num_areas, model_id, dateS, period, +num, +delta).
      subscribe(res => this.printODMatrix(res), err => console.log(err));
  }

  odMatrixCustom() {
    console.log('660:bikes.ts:odMatrixCustom::: ');
  }

  getBikeModels0() {
    console.log('663:bikes.ts:getBikeModels0::: ');
    this.getBikemodelsService.getValues(this.city).subscribe(res => this.dataToModelsTable(res), err => console.log(err));
    this.getCalendarData();
  }

  printODMatrix(data: any) {
    //console.log('666:bikes.ts:printODMatrix::: data='+JSON.stringify(data));
    this.mats = data['result'];
    this.ts   = data['ts'];
    this.calcMMSeries();
    let ini = new Date(this.ts[0]);
    let end = new Date(this.ts[this.ts.length - 1]);
    this.printResultODMatrix(this.mats, ini, end);
  }

  calcMMSeries() {
    this.mm_series = {};
    console.log('calcMMSeries::: this.mats.length='+this.mats.length);
    for (let k = 0; k < this.mats.length; k++) {
      //console.log('calcMMSeries::: this.mats['+k+'].length='+this.mats[k].length);
      for (let p = 0; p < this.mats[k].length; p++) {
        let ele = this.mats[k][p];
        let key = ele['o'] + '#' + ele['d'];
        if (key in this.mm_series) {
          if (ele['p'].length !== 'undefined' && ele['p'].length === 4) {
            this.mm_series[key].push([this.ts[k] * 1000, ele['p'][0]]);
          } else {
            this.mm_series[key].push([this.ts[k] * 1000, ele['p']]);
          }
        }
        else {

          if (ele['p'].length !== 'undefined' && ele['p'].length === 4) {
            this.mm_series[key] = [[this.ts[k] * 1000, ele['p'][0]]];
          } else {
            this.mm_series[key] = [[this.ts[k] * 1000, ele['p']]];
          }
        }
      }
    }
  }

  printResultODMatrix(mats:any[], ini, end) {
    this.containerNode.innerHTML = "";
    console.log('odmatrix.js.printResultODMatrix::: ini=' + ini);
    console.log('odmatrix.js.printResultODMatrix::: end=' + end);
    this.slider_max = (mats.length - 1);
    this.slider_val = 0;
    this.showMat(0);
  }

  showMat(val: number) {
    let container: HTMLDivElement   = <HTMLDivElement>document.getElementById('container_1');
    let dateLabel: HTMLLabelElement = <HTMLLabelElement>document.getElementById('dateLabel');
    let mat = this.mats[val];
    let datetimeS = this.lformatDateTime(new Date(this.ts[val] * 1000));
    dateLabel.innerHTML = datetimeS;
    if (this.od_chart !== null && this.od_chart !== undefined) {
      if (this.od_chart.xAxis[0] !== undefined) {
        this.od_chart.xAxis[0].options.plotLines[0].value = this.ts[val] * 1000;
        this.od_chart.xAxis[0].update();
      }
    }
    let mm = {};
    let uu = {};
    let ll = {};
    let ss = {};
    let num_areas = Math.sqrt(mat.length);
    let labels = [];
    for (let k = 0; k < num_areas; k++) {
      labels.push(k + 1);
      //console.log("labels["+k+"]="+labels[k]);
    }

    for (let i in labels) {
      let o = labels[i];
      mm[o] = {};
      uu[o] = {};
      ll[o] = {};
      ss[o] = {};
      for (let j in labels) {
        let d = labels[j];
        mm[o][d] = 0.0;
        uu[o][d] = -1;
        ll[o][d] = -1;
        ss[o][d] = -1;
      }
    }
    for (let i = 0; i < mat.length; i++) {
      let val = mat[i];
      let o = val['o'];
      let d = val['d'];
      if (val['p'].length !== 'undefined' && val['p'].length === 4) {
        mm[o][d] = val['p'][0].toFixed(2);
        uu[o][d] = val['p'][3];
        ll[o][d] = val['p'][2];
        ss[o][d] = val['p'][1];
      } else {
        mm[o][d] = val['p'].toFixed(2);
        uu[o][d] = val['p'].toFixed(2);
        ll[o][d] = val['p'].toFixed(2);
        ss[o][d] = 0;
      }
    }
    let table = this.buildTable(labels, mm, uu, ll, ss);
    container.innerHTML = "";
    container.appendChild(table);
    if (this.selected_key !== 'undefined') {
      let ttable: HTMLTableElement = <HTMLTableElement>document.getElementById('odTable');
      for (let i = 0; i < ttable.rows.length; i++) {
        let row: HTMLTableRowElement = <HTMLTableRowElement>ttable.rows[i];
        for (let j = 0; j < row.cells.length; j++) {
          let ccell = row.cells[j];
          ccell.style.backgroundColor = "white";
          if (ccell.id === this.selected_key) {
            ccell.style.backgroundColor = '#FED8B1';
          }
          //ccell.style.borderWidth = '1px';
          //ccell.style.border      = 'solid';
        }
      }
      ttable['component'] = this;
    }
    
    document.querySelectorAll('#odTable td').forEach(e => e.addEventListener("click", function () {
      console.log("clicked");
      let ttable: HTMLTableElement = <HTMLTableElement>document.getElementById('odTable');
      let component = ttable['component'];
      for (let i = 0; i < ttable.rows.length; i++) {
        let row = ttable.rows[i];
        for (let j = 0; j < row.cells.length; j++) {
          let ccell = row.cells[j];
          ccell.style.backgroundColor = "white";
          //ccell.style.borderWidth = '1px';
          //ccell.style.border      = 'solid';          
        }
      }
      if (this.id.includes("#")) {
        let o = this.id.split("#")[0];
        let d = this.id.split("#")[1];
        console.log("clicked::: " + o + "-" + d);
        this.style.backgroundColor = '#FED8B1';
        component.selected_key = o + '#' + d;
        component.chartMatrix();
      }
    }));
  }

  buildTable(labels, objects, uu, ll, ss) {
    let table = document.createElement('table');
    let thead = document.createElement('thead');
    let tbody = document.createElement('tbody');

    let theadTr = document.createElement('tr');
    let theadTh = document.createElement('th');
    theadTh.innerHTML = "O&#92;D";
    theadTr.appendChild(theadTh);
    for (let k = 0; k < labels.length; k++) {
      let theadTh = document.createElement('th');
      let d = labels[k];
      theadTh.innerHTML = d;
      theadTh.style.border = 'solid';
      theadTh.style.borderWidth = '1px';
      theadTr.appendChild(theadTh);
    }
    thead.appendChild(theadTr);
    table.appendChild(thead);
    for (let j = 0; j < labels.length; j++) {
      let tbodyTr = document.createElement('tr');
      let theadTh = document.createElement('th');
      theadTh.style.background = '#eaeaea';
      theadTh.style.border = 'solid';
      theadTh.style.borderWidth = '1px';
      let o = labels[j];
      theadTh.innerHTML = o;

      tbodyTr.appendChild(theadTh);
      for (let k = 0; k < labels.length; k++) {
        let d = labels[k];
        let tbodyTd = document.createElement('td');
        tbodyTd.innerHTML = "<small>"+objects[o][d]+"</small>" + " <p style='font-size:8px'>[" + ll[o][d] + "," + uu[o][d] + "]</p>";
        tbodyTd.id = o + "#" + d;
        tbodyTd.style.border = 'solid';
        tbodyTd.style.borderWidth = '1px';  
        tbodyTd.style.lineHeight = '0';  
        tbodyTd.style.paddingTop = '10px';  
        tbodyTd.style.paddingBottom = '10px';  
        tbodyTr.appendChild(tbodyTd);

      }
      tbody.appendChild(tbodyTr);
    }
    table.appendChild(tbody);
    table.id = 'odTable';
    return table;
  }

  chartMatrix() {
    console.log("odmatrix.js.chartMatrix::: data.length =" + this.mats.length);
    console.log("odmatrix.js.chartMatrix:::       min_t =" + new Date(this.ts[0] * 1000));
    console.log("odmatrix.js.chartMatrix:::       max_t =" + new Date(this.ts[this.ts.length - 1] * 1000));
    console.log('odmatrix.js.chartMatrix:::         key =' + this.selected_key);
    this.ele_series = this.mm_series[this.selected_key];
    console.log('odmatrix.js.chartMatrix::: ele_series.length=' + this.ele_series.length);
    console.log('odmatrix.js.chartMatrix:::         ts.length=' + this.ts.length);
    this.xs = [];
    this.ys = [];
    for (let i = 0; i < this.ts.length; i++) {
      this.xs.push(this.ts[i] * 1000);
      this.ys.push(this.ele_series[i][1]);
    }
    console.log('odmatrix.js.chartMatrix::: xs.length=' + this.xs.length);
    /*for (let i = 0; i < this.xs.length; i++) {
      console.log('odmatrix.js.chartMatrix::: before chart::: ' + i + ':\t<' + this.xs[i] + ',' + this.ys[i] + '>');
    }*/

    this.od_chart_config = {
      type: 'line',
      data: {
        labels: this.xs,
        datasets: [{
          label: 'Bike Trips',
          backgroundColor: 'rgb(0, 0, 255)',
          type: 'line',
          borderColor: 'rgb(0, 0, 255)',
          borderWidth: 1,
          pointRadius: 1,
          yAxisID: 'y-axis-1',
          fill: false,
          data: this.ys
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [
            {
              id: 'y-axis-1',
              scaleLabel: {
                display: true,
                labelString: '# Trips'
              },
              type: 'linear',
              display: true,
              position: 'right',
              gridlines: { display: true },
              labels: { show: true },
              ticks: { beginAtZero: true }
            }],
          xAxes: [{
            type: 'time',
            time: {
              max: this.xs[this.xs.length - 1],
              min: this.xs[0],
              // unit: 'millisecond',
              displayFormats: {
                'millisecond': 'DD-MM-YY',
                'second': 'DD-MM-YY',
                'minute': 'DD-MM-YY',
                'hour': 'HH:mm DD-MM-YY',
                'day': 'HH:mm DD-MM-YY'
              }
            }
          }]
        },
        pan: {
          enabled: true,
          mode: 'x',
          speed: 1
        },
        zoom: {
          enabled: true,
          mode: 'x',
          speed: 100
        }
      }
    };
    if ( this.chart    !== null ) { try { this.chart.destroy();    } catch (err) { console.log(err); } }
    if ( this.od_chart !== null ) { try { this.od_chart.destroy(); } catch (err) { console.log(err); } }


    this.od_chart = new Chart(
      this.containerNode,
      this.od_chart_config
    );
  };



  dataToModelsTable(data: any[]) {
    console.log('espiras.js.dataToModelsTable::: models=' + data);
    var ttable: HTMLTableElement = <HTMLTableElement>document.getElementById("models_table");
    ttable.innerHTML = "<tr><th style=\"border:solid;border-width:1px\"><b>Model</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>&Delta;T</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>#</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>Type</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>Size</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>Ini</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>End</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b># Areas</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>Status</b></th></tr>";
    for (let k = 0; k < data.length; k++) {
      let ele = data[k];
      let row: HTMLTableRowElement = <HTMLTableRowElement>ttable.insertRow(ttable.rows.length);
      let cell0: HTMLTableCellElement = <HTMLTableCellElement>row.insertCell(0);
      let cell1: HTMLTableCellElement = <HTMLTableCellElement>row.insertCell(1);
      let cell2: HTMLTableCellElement = <HTMLTableCellElement>row.insertCell(2);
      let cell3: HTMLTableCellElement = <HTMLTableCellElement>row.insertCell(3);
      let cell4: HTMLTableCellElement = <HTMLTableCellElement>row.insertCell(4);
      let cell5: HTMLTableCellElement = <HTMLTableCellElement>row.insertCell(5);
      let cell6: HTMLTableCellElement = <HTMLTableCellElement>row.insertCell(6);
      let cell7: HTMLTableCellElement = <HTMLTableCellElement>row.insertCell(7);
      let cell8: HTMLTableCellElement = <HTMLTableCellElement>row.insertCell(8);
      cell0.innerHTML = ele['model_id'];
      cell0.style.border = 'solid';
      cell0.style.borderWidth = '1px';
      cell1.innerHTML = ele['delta_t'];
      cell1.style.border = 'solid';
      cell1.style.borderWidth = '1px';
      cell2.innerHTML = ele['num_features'];
      cell2.style.border = 'solid';
      cell2.style.borderWidth = '1px';
      cell3.innerHTML = ele['inference_type'];
      cell3.style.border = 'solid';
      cell3.style.borderWidth = '1px';
      cell4.innerHTML = ele['size'];
      cell4.style.border = 'solid';
      cell4.style.borderWidth = '1px';
      cell5.innerHTML = ele['ini_date'];
      cell5.style.border = 'solid';
      cell5.style.borderWidth = '1px';
      cell6.innerHTML = ele['end_date'];
      cell6.style.border = 'solid';
      cell6.style.borderWidth = '1px';
      cell7.innerHTML = ele['num_areas'];
      cell7.style.border = 'solid';
      cell7.style.borderWidth = '1px';
      cell8.innerHTML = ele['status'];
      cell8.style.border = 'solid';
      cell8.style.borderWidth = '1px';
    }
  }

  /////////////////////////////////////////////////
  openLoadPointsModal() {
    document.getElementById('loadPointsModal').style.display = 'block';
  }
  openLoadAreasModal() {
    document.getElementById('loadAreasModal').style.display = 'block';
  }

  closeCustomODMatrixModal() {
    document.getElementById('customOdMatrixModal').style.display = 'none';
  }
  closeLoadPointsModal() {
    document.getElementById('loadPointsModal').style.display = 'none';
  }
  /////////////////////////////////////////////////
  // Voronoi
  /////////////////////////////////////////////////

  loadAreas() {

    if (this.areas !== undefined && this.areas !== null) {
      this.map.removeLayer(this.areas);
    }
    if (this.points !== undefined && this.points !== null) {
      this.map.removeLayer(this.points);
    }

    let ttext = document.getElementById('inputAreasID').textContent;
    let ttextJSON = JSON.parse(ttext);

    this.markers = [];
    this.areas = L.geoJSON(ttextJSON).addTo(this.map);

    document.getElementById('loadAreasModal').style.display = 'none';
  }

  loadPoints() {
    let ttext = document.getElementById('inputVoronoiID').textContent;
    let ttextJSON = JSON.parse(ttext);
    console.log("loadPoints::: ttextJSON=" + JSON.stringify(ttextJSON));
    if (this.areas !== undefined && this.areas !== null) {
      this.map.removeLayer(this.areas);
    }
    if (this.points !== undefined && this.points !== null) {
      this.map.removeLayer(this.points);
    }
    this.markers = [];
    this.points = L.geoJSON(ttextJSON).addTo(this.map);
    document.getElementById('loadPointsModal').style.display = 'none';
  }

  createVoronoi() {
    console.log('createVoronoi::: in routine');
    let ttext = document.getElementById('inputVoronoiID').textContent;
    let ttextJSON = JSON.parse(ttext);
    if (this.areas !== undefined && this.areas !== null) {
      this.map.removeLayer(this.areas);
    }
    console.log('createVoronoi before calling services');
    this.putVoronoiService.putPoints(JSON.stringify(ttextJSON)).subscribe(data => this.printVoronoi(JSON.stringify(data)));
  }

  printVoronoi(data: any) {
    console.log('printVoronoi::: data=' + JSON.stringify(data));
    console.log('bike.ts:::printVoronoi');
  }

  resetZoom() {
    console.log('resetZoom::: in function');
  }
  //////////////////////////////////////////////////////////
  getSelectedRow() {
    let ttable: HTMLTableElement = <HTMLTableElement>document.getElementById('models_table');
    for (let i = 0; i < ttable.rows.length; i++) {
      let row = ttable.rows[i];
      if (row.cells[0].style.backgroundColor !== 'white') {
        return i;
      }
    }
    return -1;
  }
  getSelectedModel() {
    let sel = this.getSelectedRow();
    let ttable: HTMLTableElement = <HTMLTableElement>document.getElementById('models_table');
    let row = ttable.rows[sel];
    return row.cells[0].innerHTML;
  }

  getSelectedDeltaT() {
    let sel = this.getSelectedRow();
    let ttable: HTMLTableElement = <HTMLTableElement>document.getElementById('models_table');
    let row = ttable.rows[sel];
    return row.cells[1].innerHTML;
  }

  getSelectedNum() {
    let sel = this.getSelectedRow();
    let ttable: HTMLTableElement = <HTMLTableElement>document.getElementById('models_table');
    let row = ttable.rows[sel];
    return row.cells[2].innerHTML;
  }

  getSelectedType() {
    let sel = this.getSelectedRow();
    let ttable: HTMLTableElement = <HTMLTableElement>document.getElementById('models_table');
    let row = ttable.rows[sel];
    return row.cells[3].innerHTML;
  }

  getSelectedNumAreas() {
    let sel = this.getSelectedRow();
    let ttable: HTMLTableElement = <HTMLTableElement>document.getElementById('models_table');
    let row = ttable.rows[sel];
    return row.cells[7].innerHTML;
  }



}


