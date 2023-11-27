import { Component, OnInit }        from '@angular/core';
//import { DateAdapter } from '@angular/material/core';
import * as L from 'leaflet';
import { GetEspirasService }        from '../services/get-espiras.service';
import { GetModelsService }         from '../services/get-models.service';
import { GetEspiradataService }     from '../services/get-espiradata.service';
import { GetTestpredictionService } from '../services/get-testprediction.service';
import { GetCalendarService }       from '../services/get-calendar.service';
import { GetMeteoService }          from '../services/get-meteo.service';
import { GetPredictionService }     from '../services/get-prediction.service';
import { CreateNewmodelService }    from '../services/create-newmodel.service';
import { Chart } from 'chart.js';
//import { clearLine } from 'readline';

@Component({
  selector:  'ngx-traffic-prediction',
  templateUrl: './traffic-prediction.component.html',
  styleUrls:  ['./traffic-prediction.component.scss']
})

export class TrafficPredictionComponent implements OnInit {

  constructor(private getEspirasService:        GetEspirasService, 
              private getModelsService:         GetModelsService,
              private getEspiradataService:     GetEspiradataService,
              private getTestPredictionService: GetTestpredictionService,
              private getCalendarService:       GetCalendarService,
              private getMeteoService:          GetMeteoService,
              private getPredictionService:     GetPredictionService,
              private createNewmodelService:    CreateNewmodelService
             ) { }

  private accmarkers:any[]     = [];
  private markers:any[]        = [];
  private marker:any           = null;
  private depmarkers:any[]     = [];
  private intensidadJA:any     = {};
  private temperaturaJA:any    = {};
  private dep_lines:any[]      = [];
  private dep_lines_SAVE:any[] = [];
  private chart:any            = null;
  private dateS                = null;

  private countMetrics:any[]   = [];
  private calendarInfo:any     = {};
  private espirasLocations:any = {};
  private city:string          = "0";
  private map: L.Map;

  private static BIO_LON: number = -2.9356732032001926;
  private static BIO_LAT: number = 43.26201529732467;

  private static AMS_LON: number = 4.895325492686641;
  private static AMS_LAT: number = 52.375147927015995;

  private static HEL_LON: number = 24.925176054721625;
  private static HEL_LAT: number = 60.22470512386342;

  private static MES_LON: number = 15.553426081599502;
  private static MES_LAT: number = 38.18445422457372;  

  public chart_data:any       = null;
  public chart_options:any    = null;  

  public nfecha:Date = new Date();
  public ofecha:Date = new Date();
  public sfecha:Date = new Date();
  public  fecha:Date = new Date();
  //public lfecha:Date = new Date();
  public rfecha:Date = new Date();
  public rDate:Date = new Date();
  public lDate:Date = new Date();
  
  options = {
    layers: [
      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' }),
    ],
    zoom: 12,
    center: L.latLng({ lat: 43.26201529732467, lng: -2.9356732032001926 }),
  };
  
  onMapReady(map: L.Map) {
    this.map = map;
    setTimeout(() => {
     // this.map.invalidateSize();
     // this.map.addLayer(this.layer2018);
     // this.map.addLayer(this.layer2020);
     // this.map.fitBounds(this.layer2020.getBounds(), {padding: [50, 50]});
    }, 50);

  }

  ngOnInit(): void {
    Chart.defaults.stripe    = Chart.helpers.clone(Chart.defaults.line);
    Chart.controllers.stripe = Chart.controllers.line.extend({
      draw: function(ease:any) {
        var result = Chart.controllers.line.prototype.draw.apply(this, arguments);

        // don't render the stripes till we've finished animating
        if (!this.rendered && ease !== 1)
          return;
        this.rendered = true;


        var helpers = Chart.helpers;
        var meta    = this.getMeta();
        var yScale  = this.getScaleForId(meta.yAxisID);
        var yScaleZeroPixel = yScale.getPixelForValue(0);
        var widths = this.getDataset().width;
        var ctx    = this.chart.chart.ctx;

        ctx.save();
        ctx.fillStyle = this.getDataset().backgroundColor;
        ctx.lineWidth = 1;
        ctx.beginPath();

        // initialize the data and bezier control points for the top of the stripe
        helpers.each(meta.data, function(point:any, index:any) {
          point._view.y += (yScale.getPixelForValue(widths[index]) - yScaleZeroPixel);
        });
        Chart.controllers.line.prototype.updateBezierControlPoints.apply(this);

        // draw the top of the stripe
        helpers.each(meta.data, function(point:any, index:number) {
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
        helpers.each(meta.data, function(point, index) {
          point._view.y -= 2 * (yScale.getPixelForValue(widths[index]) - yScaleZeroPixel);
        });
        // we are drawing the points in the reverse direction
        meta.data.reverse();
        Chart.controllers.line.prototype.updateBezierControlPoints.apply(this);

        // draw the bottom of the stripe
        helpers.each(meta.data, function(point:any, index:number) {
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
        helpers.each(meta.data, function(point, index) {
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
    this.getEspirasLocations0();
    console.log('espiras.js.ngOnInit::: after getEspirasLocations0');
  }

  clickModelTable(e:any){   
    console.log('mtable clicked...');
    let ttable:HTMLTableElement = <HTMLTableElement> document.getElementById("models_table");
    for( let i=0;i<ttable.rows.length;i++){
        let row = ttable.rows[i];
        for(let j=0;j<row.cells.length;j++){
          let ccell = row.cells[j];
          ccell.style.backgroundColor = "white";
          ccell.style.border = 'solid';
          ccell.style.borderWidth = '1px';
        }
    }
    let et:HTMLElement = <HTMLElement> e.target;
    let row:HTMLTableRowElement = <HTMLTableRowElement> et.parentNode;
    for(let j=0;j<row.cells.length;j++){
      let ccell = row.cells[j];
      ccell.style.backgroundColor = "#FED8B1";
      ccell.style.border = 'solid';
      ccell.style.borderWidth = '1px';        
    }
    let firstRow = ttable.rows[0];
    for(let j=0;j<firstRow.cells.length;j++){
      let ccell = firstRow.cells[j];
      ccell.style.backgroundColor = "white";
      ccell.style.border = 'solid';
      ccell.style.borderWidth = '1px';        
    }            
  }

  changeCity(): void{
    let e = (document.getElementById("cityComboBox")) as HTMLSelectElement;
    let sel = e.selectedIndex;
    let opt = e.options[sel];
    this.city = (<HTMLOptionElement>opt).value;
    let llat = 0;
    let llon = 0;
    let lzoom = 12;

    if ( this.city === "0" ){
      llat = TrafficPredictionComponent.BIO_LAT;
      llon = TrafficPredictionComponent.BIO_LON; 
    }
    else if ( this.city === "1" ){
      llat = TrafficPredictionComponent.AMS_LAT;
      llon = TrafficPredictionComponent.AMS_LON;        
    }
    else if ( this.city === "2" ){
      llat = TrafficPredictionComponent.HEL_LAT;
      llon = TrafficPredictionComponent.HEL_LON;  
      lzoom = 11;
    }
    else if ( this.city === "3" ){
      llat = TrafficPredictionComponent.MES_LAT;
      llon = TrafficPredictionComponent.MES_LON;
      lzoom = 13;
    }    
    if ( this.marker !== null ) this.marker.setMap(null);
    let center:L.LatLng = L.latLng({ lat: llat, lng: llon });
    console.log("changeCity::: myLatLng="+JSON.stringify(center)+" zoom="+lzoom);
    this.map.flyTo(center, lzoom);
    console.log("myLatLng="+JSON.stringify(center)+" zoom="+lzoom);

    //const containerNode = document.getElementById('container_canvas');
    //containerNode.innerHTML = '';
    this.getEspirasLocations0();    
  }

  getEspirasLocations0(): void{
    this.getEspirasService.getValues(this.city).subscribe(res => this.getEspirasLocations(res), err => console.log(err));
  }

  public selectEspira(lmarker:any) {
    console.log('espiras.js.selectEspira:::');
    console.log('espiras.js.toggleBounce::: pos='+lmarker.getLatLng()+" title="+lmarker['title']);
    for (let k=0;k<this.markers.length;k++){
      this.markers[k].setStyle({color: 'blue',fillColor: '#30f',});
    }  
    //local_marker.setAnimation(google.maps.Animation.BOUNCE);
    lmarker.setStyle({color: 'red', fillColor: '#f03'});
    console.log('title='+lmarker['title']);
    //let lcity = local_marker.title.split("##")[1];
    let lid   = lmarker['title'];
    console.log('city='+this.city+" id="+lid);
    this.getEspiraData(lid);
    let esp = this.espirasLocations[lmarker['title']];
    lmarker['component'].dataToTable(esp);
    let lzoom = this.map.getZoom()+2;
    this.map.flyTo(lmarker.getLatLng(), lzoom);
  }

  getEspirasLocations(data:any):void{
    console.log("espiras.js.getEspirasLocations::: len(data)="+data.length+' old len='+this.markers.length);
    for (let k=0;k<this.markers.length;k++){
        console.log('removing... k='+k);
        this.map.removeLayer(this.markers[k]);
    }
    this.markers = [];
    this.espirasLocations = {};
    console.log("espiras.js.getEspirasLocations::: len(espirasLocations)="+ Object.keys(this.espirasLocations).length);
    
    for (let k=0; k<data.length; k++) {
        let espira = data[k];                  
        let lkey = espira['id'];
        //console.log('espiras.js.getEspirasLocations::: lkey='+lkey+' lat='+espira['lat']+', lon='+espira['lon']);
        var lmarker = L.circle([espira['lat'], espira['lon']], {
            color:     'blue',
            fillColor: '#30f',
            fillOpacity: 0.5,
            radius:      5
        }).addTo(this.map);  
        lmarker['title'] = lkey;
        lmarker['component'] = this;
        //console.log('espiras.js.getEspirasLocations::: lmarker='+JSON.stringify(lmarker));
        lmarker.on("click", function (event) { this['component'].selectEspira(this); });
        this.espirasLocations[lkey] = espira;
        lmarker.bindPopup("id="+lkey);
        this.markers.push(lmarker);
    }

    console.log("espiras.js.getEspirasLocations::: len(espirasLocations)="+ Object.keys(this.espirasLocations).length);
    console.log("espiras.js.getEspirasLocations::: len(this.markers)="+this.markers.length);
    this.getModels0();
  }

  getModels0():void{
    this.getModelsService.getValues(this.city).subscribe(res => this.getModels(res), err => console.log(err));
  }

  getModels(models:any):void{
    this.dataToModelsTable(models);
    this.getCalendarData();
  }

  getCalendarData(){
    this.getCalendarService.getValues(this.city).subscribe(res => this.createCalendar0(res), err => console.log(err));
  }

  createCalendar0(data:any){
    this.calendarInfo = data;
    this.createCalendar(this.fecha);
    this.getMeteoData0();
  }

  getMeteoData0(){
    this.getMeteoService.getValues(this.city).subscribe(res => this.getMeteoData(res), err => console.log(err));
  }

  getMeteoData(data:any){
    this.temperaturaJA = data['temps'];
    this.intensidadJA  = data['precps'];
  }

  dataToModelsTable(data:any[]){
    console.log('espiras.js.dataToModelsTable::: models='+data);
    var ttable: HTMLTableElement = <HTMLTableElement>  document.getElementById("models_table");  
    ttable.innerHTML = "<tr><th style=\"border:solid;border-width:1px\"><b>Model</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>id</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>#</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>Type</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>Size</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>Ini</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>End</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>%</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>Sta</b></th>\n\
                            <th style=\"border:solid;border-width:1px\"><b>Sco</b></th></tr>";
    for(let k=0;k<data.length;k++){
        let ele = data[k];
        let row = ttable.insertRow(ttable.rows.length);
        let cell0 = row.insertCell(0);
        let cell1 = row.insertCell(1);
        let cell2 = row.insertCell(2);
        let cell3 = row.insertCell(3);
        let cell4 = row.insertCell(4);
        let cell5 = row.insertCell(5);
        let cell6 = row.insertCell(6);
        let cell7 = row.insertCell(7);
        let cell8 = row.insertCell(8);
        let cell9 = row.insertCell(9);
        cell0.innerHTML = ele['model_id'];
        cell0.style.border='solid';
        cell0.style.borderWidth='1px';
        cell1.innerHTML = ele['id'];
        cell1.style.border='solid';
        cell1.style.borderWidth='1px';        
        cell2.innerHTML = ele['num_features'];
        cell2.style.border='solid';
        cell2.style.borderWidth='1px';        
        cell3.innerHTML = ele['inference_type'];
        cell3.style.border='solid';
        cell3.style.borderWidth='1px';        
        cell4.innerHTML = ele['size'];
        cell4.style.border='solid';
        cell4.style.borderWidth='1px';        
        cell5.innerHTML = ele['ini_date'];
        cell5.style.border='solid';
        cell5.style.borderWidth='1px';        
        cell6.innerHTML = ele['end_date'];
        cell6.style.border='solid';
        cell6.style.borderWidth='1px';        
        cell7.innerHTML = ele['prct'];
        cell7.style.border='solid';
        cell7.style.borderWidth='1px';        
        cell8.innerHTML = ele['status'];
        cell8.style.border='solid';
        cell8.style.borderWidth='1px';        
        cell9.innerHTML = ele['performance'].toFixed(2);
        cell9.style.border='solid';
        cell9.style.borderWidth='1px';        
    }
  }
  
  getEspiraData(lid:string){
    this.getEspiradataService.getValues(this.city,lid).subscribe(res => this.printEspira(res), err => console.log(err));
  }

  printEspira(data:any[]){
    console.log('espiras.js.printEspira::: data.length='+data.length); 
            
    let xs = [];
    let ys = [];
    let traffic = [];
    let temps = [];
    let precs = [];
    let max_x = data[data.length-1][0];
    let min_x = data[0][0];
    for (let k=0;k<data.length;k++){
      xs.push(data[k][0]);
      ys.push(data[k][1]);
      traffic.push({x:data[k][0],y:data[k][1]});
    }
    for (let k=0;k<this.temperaturaJA.length;k++){
      if ( this.temperaturaJA[k][0] > min_x && this.temperaturaJA[k][0] < max_x ){
        temps.push({x:this.temperaturaJA[k][0],y:this.temperaturaJA[k][1]});
      }
    }
    let avg_int = 0; 
    for (let k=0;k<this.intensidadJA.length;k++){
      if ( this.intensidadJA[k][0] > min_x && this.intensidadJA[k][0] < max_x ){
        precs.push({x:this.intensidadJA[k][0],y:this.intensidadJA[k][1]});
        avg_int = avg_int + this.intensidadJA[k][1];
      }
    }    
    avg_int = avg_int / (precs.length*1.0);
    console.log('espiras.js.printChart::: avg_int='+avg_int+' precs.length='+precs.length);   

    let chart_data:any = {
      labels: xs,
      type: 'line',
      datasets: [
        {
          label:                'Veh Flow',   
          type:                 'line',
          fill:                 false,
          borderWidth:          1,
          pointRadius:          0,                    
          borderColor:          'rgb(0, 0, 255)',
          backgroundColor:      'rgb(0, 0, 255)',
          pointBorderColor:     'rgb(0, 0, 255)',
          pointBackgroundColor: 'rgb(0, 0, 255)',
          yAxisID:              'y-axis-1',
          data:                 traffic  
        },
        {   
          type:                 'line',
          label:                'Temperature',
          fill:                 false,
          borderColor:          'rgb(0, 255, 0)',
          backgroundColor:      'rgb(0, 255, 0)',
          borderWidth:          1,
          pointRadius:          0,
          borderDash:           [10,5],
          yAxisID:              'y-axis-2',
          data:                 temps        
        },
        {
          type:                 'line',
          label:                'Precipitation',
          fill:                 false, 
          backgroundColor:      'rgb(0, 255, 255)',
          borderColor:          'rgb(0, 255, 255)',
          borderWidth:          1,
          pointRadius:          0,                    
          yAxisID:              'y-axis-3',
          data:                 precs  
        } 
      ]
    };

    let chart_config:any = {
            type: 'line',
            data: chart_data,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              tooltips: {
                mode: 'label'
              },
              elements: {
                line: {
                   fill: false
                }
              },
              scales: {
                xAxes: [{ 
                  type: 'time',
                  barPercentage: 1.0,
                  time: {
                    max: data[data.length-1][0],
                    min: data[0][0],
                    displayFormats: {
                      'millisecond': 'DD-MM-YY',
                      'second':      'DD-MM-YY',
                      'minute':      'DD-MM-YY',
                      'hour':        'DD-MM-YY',
                      'day':         'DD-MM-YY',
                      'week':        'DD-MM-YY',
                      'month':       'DD-MM-YY',
                      'quarter':     'DD-MM-YY',
                      'year':        'DD-MM-YY'
                    }
                   } 
                } ],
                yAxes: [
                  {
                    id: 'y-axis-1',
                    scaleLabel: {
                      display: true,
                      labelString: '# Vehs'
                    },
                    type:     'linear',
                    display:   true, 
                    position: 'right',
                    gridlines: { display:     true },
                    labels:    { show:        true },
                    ticks:     { beginAtZero: true }
                  },
                  { 
                    id: 'y-axis-2',
                    scaleLabel: {
                      display: true,
                      labelString: 'Temp (°C)'
                    },
                    type:     'linear',
                    display:   true, 
                    position: 'right',
                    gridlines: { display: false },
                    labels:    { show:    true }
                  },
                  {
                    id: 'y-axis-3',
                    scaleLabel: {
                      display: true,
                      labelString: 'Prec. mm'
                    },                              
                    type:      'linear',
                    display:   true, 
                    position: 'right',
                    gridlines: { display: false },
                    labels:    { show:    true }
                  }
                ]
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
    
    let ctx:HTMLCanvasElement = <HTMLCanvasElement> document.getElementById("container_canvas");
    if ( this.chart !== null )   { this.chart.destroy(); }
    this.chart = new Chart(ctx, chart_config);
    
  };


  dataToTable(data:any[]){
    console.log('espiras.js.dataToTable ############################################');
    console.log(data);
    var ttable: HTMLTableElement = <HTMLTableElement> document.getElementById("stats_table");
    ttable.rows[1].cells[1].innerHTML = data['city'];
    ttable.rows[2].cells[1].innerHTML = data['id'];
    ttable.rows[3].cells[1].innerHTML = data['size'];
    ttable.rows[4].cells[1].innerHTML = data['aver'];
    ttable.rows[5].cells[1].innerHTML = data['max'];
    ttable.rows[6].cells[1].innerHTML = data['min'];
    ttable.rows[7].cells[1].innerHTML = data['delta_t'];
    ttable.rows[8].cells[1].innerHTML = data['ini_date'];
    ttable.rows[9].cells[1].innerHTML = data['end_date'];
  };
  //////////////////////////////////////////////////////////////////////////
  // Models
  //////////////////////////////////////////////////////////////////////////
  printTestPred(){
    let model_id:string = this.getSelectedModel();
    console.log('models.js.printTestPred::: model_id='+model_id);
  }

  getSelectedModel(){
    let sel = this.getSelectedRow();
    let ttable:HTMLTableElement = <HTMLTableElement> document.getElementById('models_table');
    let row = ttable.rows[sel];
    return row.cells[0].innerHTML;
  }

  getSelectedId(){
    let sel = this.getSelectedRow();
    let ttable:HTMLTableElement = <HTMLTableElement> document.getElementById('models_table');
    let row = ttable.rows[sel];
    return row.cells[1].innerHTML;     
  }

  getSelectedRow(){
    let ttable:HTMLTableElement = <HTMLTableElement> document.getElementById('models_table');
    for( let i=0;i<ttable.rows.length;i++){
        let row = ttable.rows[i];
        if ( row.cells[0].style.backgroundColor !== 'white' ){
            return i;
        }
    }
    return -1;
  }

  getSelectedNum(){
    let sel = this.getSelectedRow();
    let ttable:HTMLTableElement = <HTMLTableElement> document.getElementById('models_table');
    let row = ttable.rows[sel];
    return row.cells[2].innerHTML;     
  }

  getSelectedType(){
    let sel = this.getSelectedRow();
    let ttable:HTMLTableElement = <HTMLTableElement> document.getElementById('models_table');
    let row = ttable.rows[sel];
    return row.cells[3].innerHTML;     
  }

  getSelectedPrct(){
    let sel = this.getSelectedRow();
    let ttable:HTMLTableElement = <HTMLTableElement> document.getElementById('models_table');
    let row = ttable.rows[sel];
    return row.cells[7].innerHTML;     
  }  

  openNewModelModal(){
    let ttable: HTMLTableElement = <HTMLTableElement> document.getElementById("stats_table");  
    document.getElementById('cityNM').innerHTML = ttable.rows[1].cells[1].innerHTML;
    document.getElementById('idNM').innerHTML   = ttable.rows[2].cells[1].innerHTML;
    let ini:HTMLSelectElement = <HTMLSelectElement> document.getElementById('iniNM');
    let end:HTMLSelectElement = <HTMLSelectElement> document.getElementById('endNM');
    ini.value = ttable.rows[8].cells[1].innerHTML;
    end.value = ttable.rows[9].cells[1].innerHTML;
    document.getElementById('createModelModal').style.display = 'block';
  }

  createNewModel(){
    console.log('espiras.js.createNewModel()::: in function');
    let id       = document.getElementById('idNM').innerHTML;
    let typeS:HTMLSelectElement= <HTMLSelectElement> document.getElementById('typeNM');
    let type     = typeS.value;
    let numS:HTMLSelectElement = <HTMLSelectElement> document.getElementById('numNM');
    let num:number = +numS.value;
    let iniS:HTMLSelectElement = <HTMLSelectElement> document.getElementById('iniNM');
    let ini_date = iniS.value;
    let endS:HTMLSelectElement = <HTMLSelectElement> document.getElementById('endNM');
    let end_date = endS.value;
    let prctS:HTMLSelectElement= <HTMLSelectElement> document.getElementById('prctNM');
    let prct:number= +prctS.value;
    console.log('espiras.js.createNewModel():::\t      id=\t'+id);
    console.log('espiras.js.createNewModel():::\t    type=\t'+type);
    console.log('espiras.js.createNewModel():::\t     num=\t'+num);
    console.log('espiras.js.createNewModel():::\tini_date=\t'+ini_date);
    console.log('espiras.js.createNewModel():::\tend_date=\t'+end_date);
    console.log('espiras.js.createNewModel():::\t    prct=\t'+prct);
    this.createNewmodelService.createModel(this.city,id,type,num,ini_date,end_date,prct).subscribe(res => this.closeNewModelModal(res), err => console.log(err));
  }

  closeNewModelModal(data:any){
    console.log(data);
    document.getElementById('createModelModal').style.display = 'none';
  }
  ////////////////////////////////////////////////////////////////////////
  // calendar
  ////////////////////////////////////////////////////////////////////////
  monthToWord(val:number){
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

  populateYearCB(yyear:number){
    var mItem:HTMLOptionElement = <HTMLOptionElement> document.createElement("option");
    let ySel:HTMLSelectElement = <HTMLSelectElement> document.getElementById("yCBI");
    mItem.text = "2016";
    mItem.value = 2016+"";
    ySel.options.add(mItem);
    var mItem  = document.createElement("option");
    mItem.text = "2017";
    mItem.value = 2017+"";
    ySel.options.add(mItem);
    var mItem  = document.createElement("option");
    mItem.text = "2018";
    mItem.value = 2018+"";
    ySel.options.add(mItem);
    var mItem  = document.createElement("option");
    mItem.text = "2019";
    mItem.value = 2019+"";
    ySel.options.add(mItem); 
    var mItem  = document.createElement("option");
    mItem.text = "2020";
    mItem.value = 2020+"";
    ySel.options.add(mItem); 
    var mItem  = document.createElement("option");
    mItem.text = "2021";
    mItem.value = 2021+"";
    ySel.options.add(mItem); 
    var mItem  = document.createElement("option");
    mItem.text = "2022";
    mItem.value = 2022+"";
    ySel.options.add(mItem); 
    var mItem  = document.createElement("option");
    mItem.text = "2023";
    mItem.value = 2023+"";  
    ySel.options.add(mItem); 
    var idx = 0;
    if      ( yyear === 2016 ){ idx = 0; }
    else if ( yyear === 2017 ){ idx = 1; }
    else if ( yyear === 2018 ){ idx = 2; }
    else if ( yyear === 2019 ){ idx = 3; }
    else if ( yyear === 2020 ){ idx = 4; }
    else if ( yyear === 2021 ){ idx = 5; }
    else if ( yyear === 2022 ){ idx = 6; }
    else if ( yyear === 2023 ){ idx = 7; }
    
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

  populateMonthCB(yyear:number, monthI:number){
    var mItem :HTMLOptionElement = <HTMLOptionElement> document.createElement("option");
    let mSel:HTMLSelectElement = <HTMLSelectElement> document.getElementById("mCBI");
    mItem.text = "January";
    mItem.value = 0+"";
    mSel.options.add(mItem);
    var mItem  = document.createElement("option");
    mItem.text = "February";
    mItem.value = 1+"";
    mSel.options.add(mItem);
    var mItem  = document.createElement("option");
    mItem.text = "March";
    mItem.value = 2+"";
    mSel.options.add(mItem);
    var mItem  = document.createElement("option");
    mItem.text = "April";
    mItem.value = 3+"";
    mSel.options.add(mItem);
    var mItem  = document.createElement("option");
    mItem.text = "May";
    mItem.value = 4+"";
    mSel.options.add(mItem);
    var mItem  = document.createElement("option");
    mItem.text = "June";
    mItem.value = 5+"";
    mSel.options.add(mItem);
    var mItem  = document.createElement("option");
    mItem.text = "July";
    mItem.value = 6+"";
    mSel.options.add(mItem);
    var mItem  = document.createElement("option");
    mItem.text = "August";
    mItem.value = 7+"";
    mSel.options.add(mItem);    
    var mItem  = document.createElement("option");
    mItem.text = "September";
    mItem.value = 8+"";
    mSel.options.add(mItem); 
    var mItem  = document.createElement("option");
    mItem.text = "October";
    mItem.value = 9+"";
    mSel.options.add(mItem); 
    var mItem  = document.createElement("option");
    mItem.text = "November";
    mItem.value = 10+"";
    mSel.options.add(mItem); 
    var mItem  = document.createElement("option");
    mItem.text = "December";
    mItem.value = 11+"";
    mSel.options.add(mItem); 
    mSel.selectedIndex = monthI-1;
    /*
    mSel.addEventListener("change",function(e) {
        var mm = mSel.selectedIndex;
        var nfecha = new Date(yyear,mm,1);
        console.log("populateYearCB::: nfecha="+nfecha+" sfecha="+sfecha);
        createCalendar(nfecha);
    }); */ 
  }

  findMaxDaysInMonth(ofecha:Date){
    var temp:Date = new Date(ofecha);
    var nowMonth = ofecha.getMonth();
    var lastDay = temp.getDate();
    for(var j=1;j<32;j++){
        temp.setDate(temp.getDate()+1);
        var lMonth = temp.getMonth();
        if ( lMonth !== nowMonth ) { break; }
        lastDay = temp.getDate();
    }
    return lastDay+1;
  }

  findNumOfEmptyDays(ofecha:Date){
    var temp = new Date(ofecha);
    temp.setDate(1);
    var out = temp.getDay()-1; 
    if ( temp.getDay() === 0 ) out = 6;
    return out;
    
  }

  createCalendar(local_fecha:Date){
    console.log('calendar.js.createCalendar::: local_fecha='+local_fecha);
    this.sfecha = local_fecha;
    //console.log('calendar.js.createCalendar::: calendarInfo='+calendarInfo);
    document.getElementById("calendar").innerHTML = '';
    var btn:HTMLDivElement = <HTMLDivElement> document.createElement("div");   
    btn.style.boxSizing  = "border-box";
    btn.style.fontFamily = "Verdana, sans-serinf";
    //btn.className        = "month";
    //btn.style.position   = 'absolute';
    btn.style.width      = "100%";
    btn.style.background = '#cfb391';
    btn.style.border     = '0px';
    btn.style.boxSizing  = 'border-box';
    btn.style.marginTop  = '-16px';
    var monthI       = local_fecha.getMonth()+1;
    var month        = this.monthToWord(local_fecha.getMonth());
    var maxDaysMonth = this.findMaxDaysInMonth(local_fecha);
    var edays        = this.findNumOfEmptyDays(local_fecha);
    console.log('linea 735: local_fecha=\t'+local_fecha);
    var temp:Date    = new Date(local_fecha);
    this.lDate       = new Date(temp.setMonth(temp.getMonth()-1));
    console.log('linea 738:       lDate=\t'+this.lDate);
    temp             = new Date(local_fecha);
    this.rDate       = new Date(temp.setMonth(temp.getMonth()+1));
    console.log('linea 741:       rDate=\t'+this.rDate);
    var year = local_fecha.getFullYear();
    btn.innerHTML = "<ul id=\"parentUL\" style=\"height:100%;box-sizing:border-box;display:block;text-align:center\"><li id=\"prev\" style=\"padding-top:3px;list-style:none;float:left;\" class=\"prev\">&#10094;</li><li id=\"next\" style=\"list-style:none;float:right;padding-top:3px\" class=\"next\">&#10095;</li>";
    btn.innerHTML = btn.innerHTML + "<li style=\"text-align:center;display:block\"><select style=\"margin-left:-40px;\" id=\"mCBI\"></select><br><span style=\"font-size:18;px\"><select id=\"yCBI\"></select></span> </li></ul>";
    // week
    var weekBtn:HTMLUListElement =<HTMLUListElement> document.createElement("ul");
    weekBtn.className = "weekdays";
    weekBtn.style.color              ='rgb(102,102,102)';
    weekBtn.style.backgroundColor    = '#ddd';
    weekBtn.style.margin             = '0px';
    weekBtn.style.padding            = '0px';
    weekBtn.style.fontSize           = '13px';
    weekBtn.style.listStyle          = 'disc';
    weekBtn.style.verticalAlign      = 'baseline';
    weekBtn.style.boxSizing          = 'border-box';
    weekBtn.style.paddingInlineStart = '40px';
    weekBtn.style.paddingInlineEnd   = '40px';
    weekBtn.style.paddingLeft        = '58px';
    weekBtn.innerHTML = "  <li style=\"display:inline-block;text-transform:uppercase;color:#666;width: 14.1%;\">Mo</li><li style=\"display:inline-block;text-transform:uppercase;color:#666;width:14.1%;\">Tu</li><li style=\"display:inline-block;text-transform:uppercase;color:#666;width:14.6%;\">We</li><li style=\"display:inline-block;text-transform:uppercase;color:#666;width:14.1%;\">Th</li><li style=\"display:inline-block;text-transform:uppercase;color:#666;width:14.1%;\">Fr</li><li style=\"display:inline-block;text-transform:uppercase;color:#666;width:14.1%;\">Sa</li><li style=\"display:inline-block;text-transform:uppercase;color:#666;width:14.1%;\">Su</li>";
    // weekBtn.style.display = "inline-block";
    weekBtn.style.color = "#666";
    btn.appendChild(weekBtn);
    // days
    var daysBtn:HTMLUListElement =<HTMLUListElement> document.createElement("ul");
    daysBtn.className = "days";
    daysBtn.style.padding       = "2px";
    daysBtn.style.display       = 'block';
    daysBtn.style.verticalAlign = 'baseline';
    daysBtn.style.background    = "rgb(238,238,238)";
    daysBtn.style.fontSize      = '13px';
    daysBtn.style.listStyleType = "none";
    daysBtn.style.color         = "#58595b";
    
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
    daysBtn.style.width='100%'
    var llimit = 32;
    for(var i=0;i<edays;i++){
        var dayBtn = document.createElement("li");
        dayBtn.style.width         ='12.6%';
        dayBtn.style.listStyleType = "none";
        dayBtn.style.color         ="#777";
        dayBtn.style.marginBottom  ='5px';
        dayBtn.style.fontSize      ='100%';
        dayBtn.style.margin        = '0';
        dayBtn.style.outline       = '0';
        dayBtn.style.boxSizing     = 'border-box';
        dayBtn.style.lineHeight    = '1.35';
        //dayBtn.style.position='relative';
        dayBtn.style.listStyleType = "none";
        dayBtn.style.display       = "inline-block";
        dayBtn.style.textAlign     = "center"; 
        dayBtn.style.listStyle     = 'disc';
        dayBtn.style.verticalAlign = 'baseline';
        dayBtn.id = -i+"";
        daysBtn.append(dayBtn);   
       
    }
    for(var i=1;i<maxDaysMonth;i++){
        var dayBtn = document.createElement("li");
        dayBtn.style.width         ='12.6%'
        dayBtn.style.listStyleType = "none";
        dayBtn.style.color         ="#777";
        dayBtn.style.marginBottom  ='5px';
        dayBtn.style.fontSize      ='100%';
        dayBtn.style.margin        = '0';
        dayBtn.style.outline       = '0';
        dayBtn.style.boxSizing     = 'border-box';
        dayBtn.style.lineHeight    = '1.35';
        //dayBtn.style.position='relative';
        dayBtn.style.listStyleType = "none";
        dayBtn.style.display       = "inline-block";
        dayBtn.style.textAlign     = "center"; 
        dayBtn.style.listStyle     = 'disc';
        dayBtn.style.verticalAlign = 'baseline';        
        /*dayBtn.style.color="#777";
        dayBtn.style.listStyleType = "none";
        dayBtn.style.display = "inline-block";
        dayBtn.style.textAlign = "center"; */
        dayBtn.id = i+"";
        if ( i === this.sfecha.getDate() && (monthI-1) === this.sfecha.getMonth() && year === this.sfecha.getFullYear()){
          dayBtn.style.padding='5px';
          /*background: #cfb391;*/
          dayBtn.style.border= 'solid';
          dayBtn.style.color= 'blue !important';
          
          dayBtn.className = "active";
           var sp:HTMLSpanElement=<HTMLSpanElement> document.createElement("span");
           sp.className = "active";
           sp.innerHTML = i+"";
           dayBtn.appendChild(sp);
        }else{
            dayBtn.innerHTML = i+"";            
        }
        var mI = monthI+"";
        if ( monthI < 10 ) mI = '0'+monthI;
        var iI = i+'';
        if ( i < 10 ) iI = '0'+i;
        var dd = year+"-"+mI+"-"+iI;
        
        if ( this.calendarInfo !== null ){
          if ( dd in this.calendarInfo ){
            
            if ( this.calendarInfo[dd]["lect"] === 0 ){
              dayBtn.style.backgroundColor="#0f0";
            }
            if ( this.calendarInfo[dd]["fest"] === 1 ){
              dayBtn.style.backgroundColor="#f00";
            }
            else if ( this.calendarInfo[dd]["fest"] === 2 ){
              dayBtn.style.backgroundColor="#f0f";
            }
            else if ( this.calendarInfo[dd]["fest"] === 3 ){
              dayBtn.style.backgroundColor="#ff0";
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
          }else{
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
    document.getElementById("parentUL").addEventListener("click",function(e) {
      let targ:HTMLLIElement = <HTMLLIElement> e.target;
      if( targ && targ.nodeName === "LI" ) {         
        if ( targ.id === "prev" ){
          this['component'].createCalendar(this['component'].lDate);
        }
        else if ( targ.id === "next" ){
          this['component'].createCalendar(this['component'].rDate);
        }
      }
    });
    
    document.getElementById("daysUL")['component'] = this;
    document.getElementById("daysUL").addEventListener("click",function(e) {
      let targ:HTMLLIElement = <HTMLLIElement> e.target;
      if ( targ && targ.nodeName === "LI" ) { 
        if ( +targ.id > 0 ){
          this['component'].sfecha =  new Date(local_fecha.setDate(+targ.id));
          //changeChartZoomAndDate();
          this['component'].createCalendar(local_fecha);
        }
      }
    });
    this.populateMonthCB(year,monthI);
    this.populateYearCB(year);
  }

  lformatDate(local_date:Date) {
  //var d = new Date(date),
  let month:string = '' + (local_date.getMonth() + 1);
  let day:string   = '' + local_date.getDate();
  let year:string  = '' + local_date.getFullYear();

  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;
  let out = [year, month, day].join('-');
  return out;
  }
/*
changeChartZoomAndDate(){
    var min = sfecha.getTime();
    if ( typeof chart !== 'undefined' ){
        if ( typeof chart.rangeSelector  !== 'undefined' ){
            if ( typeof chart.rangeSelector.options !== 'undefined' ){
                if ( typeof this.chart.rangeSelector.options.selected !== 'undefined'){

                    var range = this.chart.rangeSelector.options.selected;
                    var width = 24*60*60*1000;
                    if      ( range === 0 ){ width =      24*60*60*1000; }
                    else if ( range === 1 ){ width =    3*24*60*60*1000; }
                    else if ( range === 2 ){ width =    7*24*60*60*1000; }
                    else if ( range === 3 ){ width =   30*24*60*60*1000; }
                    else if ( range === 4 ){ width = 6*30*24*60*60*1000; }
                    else if ( range === 5 ){ width =  365*24*60*60*1000; }
                    else if ( range === 6 ){ width =  365*24*60*60*1000; }
                    if ( typeof this.chart !== 'undefined' ){
                        var offset = 9*60*60*1000;
                        this.chart.xAxis[0].setExtremes(min+offset, min+width+offset);
                    }
                }
            }
        }
    }
}*/



  ////////////////////////////////////////////////////////////////////////
  // prediction
  ////////////////////////////////////////////////////////////////////////
  predict(period:number){
    console.log('1055:predict::: dateS='+this.sfecha);  
    let ddate       = this.lformatDate(this.sfecha);
    let model_id    = this.getSelectedModel();
    let id:string   = this.getSelectedId();
    let city        = this.city;
    let num:number  =+this.getSelectedNum();
    let type:number = +this.getSelectedType();  
    console.log('560:predict:::    ddate=\t'+ddate);
    console.log('561:predict::: model_id=\t'+model_id);
    console.log('562:predict:::       id=\t'+id);
    console.log('563:predict:::      num=\t'+num);
    console.log('564:predict:::     type=\t'+type);
    if ( period < 3){
      this.getPredictionService.getValues(model_id,ddate.toString(),period,type,this.city,id,num).subscribe(res => this.printPrediction(res['result']), err => console.log(err));  
    }
    else if( period === 3 ){
      let iniS:HTMLSelectElement = <HTMLSelectElement> document.getElementById("iniDateCP");
      let ini = iniS.value;
      let endS:HTMLSelectElement = <HTMLSelectElement> document.getElementById("endDateCP");
      let end = endS.value;
      this.getPredictionService.getValuesCustom(model_id,ini,end,type,this.city,id,num).subscribe(res => this.printPrediction(res['result']), err => console.log(err));  
    }
  }
  printPrediction(data:any){
    console.log("espiras.js.printPrediction::: before chart::: data.length="+data['preds'].length);
    let max_x = data['preds'][data['preds'].length-1][0];
    let min_x = data['preds'][0][0];    
    console.log("espiras.js.printPrediction::: before chart::: min_x ="+new Date(min_x));
    console.log("espiras.js.printPrediction::: before chart::: max_x ="+new Date(max_x));    
    document.getElementById('container_canvas').innerHTML = '';
    let xs = [];
    let ys = [];
    let preds   = [];
    let preds_w = [];
    let temps   = [];
    let precs   = [];
    let max_y   = 0;
    for (let k=0;k<data['preds'].length;k++){
        xs.push(data['preds'][k][0]);
        ys.push(data['preds'][k][1]);
        preds.push(data['preds'][k][1]);
        preds_w.push(data['limits'][k][2]-data['limits'][k][1]);
        max_y = Math.max(max_y,data['limits'][k][2]);
    }
    max_y = 1.2*max_y;
    for (let k=0;k<this.temperaturaJA.length;k++){
        if ( this.temperaturaJA[k][0] > min_x && this.temperaturaJA[k][0] < max_x ){
            temps.push({x:this.temperaturaJA[k][0],y:this.temperaturaJA[k][1]});
        }
    }
    let avg_int = 0;
    for (let k=0;k<this.intensidadJA.length;k++){
        if ( this.intensidadJA[k][0] > min_x && this.intensidadJA[k][0] < max_x ){
            precs.push({x:this.intensidadJA[k][0],y:this.intensidadJA[k][1]});
            avg_int = avg_int + this.intensidadJA[k][1];
        }
    }    
    avg_int = avg_int / (precs.length*1.0);
    console.log('espiras.js.printPrediction::: avg_int='+avg_int+' precs.length='+precs.length);
    console.log('espiras.js.printPrediction::: preds_w='+preds_w.length);
    let chart_config:any = {
      type: 'stripe',
      data: {
            labels: xs, 
            datasets: [
            {   label:           'Pred',
                backgroundColor: 'rgb(255, 0, 0,0.1)',
                type:            'stripe',
                fill:            false,
                borderColor:     'rgb(255, 0, 0,1)',
                borderWidth:      1,
                pointRadius:      0,
                yAxisID:         'y-axis-1',
                data:            preds,
                width:           preds_w
            },
            {   label:           'Temperature',
                backgroundColor: 'rgb(0, 255, 0)',
                type:            'line',
                fill:            false,
                borderColor:     'rgb(0, 255, 0)',
                borderWidth:     1,
                pointRadius:     0,
                borderDash:      [10,5],
                yAxisID:         'y-axis-2',
                data:            temps                
            },
            {       
                type:                 'line',
                label:                'Precipitation',
                fill:                 false, 
                backgroundColor:      'rgb(0, 255, 255)',
                borderColor:          'rgb(0, 255, 255)',
                borderWidth:          1,
                pointRadius:          0,                    
                yAxisID:              'y-axis-3',
                data:                 precs  
            }]
        },
      options:{   responsive: true,
                    maintainAspectRatio: false,
                    scales:  {
                        yAxes: [
                            {
                              id: 'y-axis-1',
                              scaleLabel: {
                                  display: true,
                                  labelString: '# Vehs'
                              },
                              type:     'linear',
                              display:   true, 
                              position: 'right',
                              gridlines: { display: true },
                              labels:    { show:    true },
                              ticks:     { beginAtZero:true, 
                                           suggestedMax: max_y 
                                         }
                            },
                            { 
                              id: 'y-axis-2',
                              scaleLabel: {
                                  display: true,
                                  labelString: 'Temp (°C)'
                              },
                              type:     'linear',
                              display:   true, 
                              position: 'right',
                              gridlines: { display: false },
                              labels:    { show:    true }
                            },
                            {
                              id: 'y-axis-3',
                              scaleLabel: {
                                  display: true,
                                  labelString: 'Prec. mm'
                              },                              
                              type:      'linear',
                              display:   true, 
                              position: 'right',
                              gridlines: { display: false },
                              labels:    { show:    true }
                            }],
                        xAxes: [{ 
                                type: 'time',
                                barPercentage: 1.0,
                                time: {
                                     max: max_x,
                                     min: min_x,
                                    // unit: 'millisecond',
                                     displayFormats: {
                                         'hour':        'HH:mm DD-MM-YY',
                                         'day':         'HH:mm DD-MM-YY'
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

    let ctx:HTMLCanvasElement = <HTMLCanvasElement> document.getElementById("container_canvas");
    ctx.style.backgroundColor = 'rgba(192,192,192,0.3)';
    if ( this.chart !== null )   { this.chart.destroy(); }
    this.chart = new Chart(ctx, chart_config);
    console.log("espiras.js.printPrediction::: leaving...");
  }
  closeCreateModelModal(){
    document.getElementById('createModelModal').style.display='none';
  }
  closeCustomPredictModal(){
    document.getElementById('customPredictModal').style.display='none';
  }
  openPredictCustomModal(){
    document.getElementById('customPredictModal').style.display='block';
  }
}