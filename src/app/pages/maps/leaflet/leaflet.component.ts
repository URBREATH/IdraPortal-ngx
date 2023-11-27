import { Component, OnInit } from '@angular/core';

import * as L from 'leaflet';
import { NgElement, WithProperties } from '@angular/elements';
// import AMPedestrian from '../../../../assets/map/am_plusnetwork_pedestrian.json';
// import AMPlusMainNetwork from '../../../../assets/map/am_streets.json';
// import AMMajorStreets from '../../../../assets/map/am_major_streets.json';
import AMTram2020 from '../../../../assets/map/am_tram_2020.json';
import AMTram2018 from '../../../../assets/map/am_tram_2018.json';
import AMTram2020_Stops from '../../../../assets/map/am_tramstop_2020.json';
import AMTram2018_Stops from '../../../../assets/map/am_tramstop_2018.json';


@Component({
  selector: 'ngx-leaflet',
  styleUrls: ['./leaflet.component.scss'],
  template: `
  <div class="row d-flex justify-content-between align-items-center">
    <nb-card class="col-5">
      <nb-card-header>Tram Lines 2018</nb-card-header>
      <nb-card-body>
        <div leaflet id="map1" #map1 
        [leafletOptions]="options" 
        [leafletLayersControl]="layersControl1"
        [leafletLayers]="layers"></div>
        <div class="mt-1">
          <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua.
          </p>
        </div>
      </nb-card-body>
    </nb-card>
    <nb-card class="col-5">
      <nb-card-header>Tram Lines 2020</nb-card-header>
      <nb-card-body>
        <div leaflet id="map2" #map2 
        [leafletOptions]="options1" 
        [leafletLayersControl]="layersControl"
        [leafletLayers]="layers2"></div>
        <div class="mt-1">
          <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua.
          </p>
        </div>
      </nb-card-body>
    </nb-card>
</div>
  `,
})
export class LeafletComponent {

  public map1: L.Map;

  public map2: L.Map;

  icon = new L.Icon({
    iconSize: [25, 41],
    iconAnchor: [13, 41],
    iconUrl: 'assets/img/markers/marker-icon.png',
    iconRetinaUrl: 'assets/img/markers/marker-icon-2x.png',
    shadowUrl: 'assets/img/markers/marker-shadow.png'
  });

  options = {
    layers: [
      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' }),
    ],
    zoom: 9,
    center: L.latLng({ lat: 52.372664783594274, lng: 4.8950958251953125 }),
  };

  layersControl = {
    overlays: {
      'Amsterdam Tram - 2020': this.getLayer('Tram 2020',<any>AMTram2020),
      'Amsterdam Tram Stops - 2020': this.getLayer('Stop Tram 2020',<any>AMTram2020_Stops),
    }
  }

  layersControl1 = {
    overlays: {
      'Amsterdam Tram - 2018': this.getLayer('Tram 2018',<any>AMTram2018),
      'Amsterdam Tram Stops - 2018': this.getLayer('Stop Tram 2018',<any>AMTram2018_Stops),
    }
  }

  options1 = {
    layers: [
      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' }),
    ],
    zoom: 9,
    center: L.latLng({ lat: 52.372664783594274, lng: 4.8950958251953125 }),
  };

  layer = L.marker([52.372664783594274, 4.8950958251953125], {
    icon: L.icon({
      iconSize: [25, 41],
      iconAnchor: [13, 41],
      iconUrl: 'assets/img/markers/marker-icon.png',
      iconRetinaUrl: 'assets/img/markers/marker-icon-2x.png',
      shadowUrl: 'assets/img/markers/marker-shadow.png'
    })
  }).bindPopup("Amsterdam");

  layer2 = L.marker([52.372664783594274, 4.8950958251953125], {
    icon: L.icon({
      iconSize: [25, 41],
      iconAnchor: [13, 41],
      iconUrl: 'assets/img/markers/marker-icon.png',
      iconRetinaUrl: 'assets/img/markers/marker-icon-2x.png',
      shadowUrl: 'assets/img/markers/marker-shadow.png'
    })
  }).bindPopup("Amsterdam");



  layers = [this.layer];

  layers2 = [this.layer2];


  public getLayer(title,l) {
  
      let layer = L.geoJSON(l,
        {
          pointToLayer: function (feature, latlng) {

            let icon = L.icon({
              iconSize: [25, 41],
              iconAnchor: [13, 41],
              iconUrl: 'assets/img/markers/marker-icon.png',
              iconRetinaUrl: 'assets/img/markers/marker-icon-2x.png',
              shadowUrl: 'assets/img/markers/marker-shadow.png'
            });
            let zIndexOffset = 100;
            return L.marker(latlng, { icon: icon, zIndexOffset: zIndexOffset, riseOnHover: true, riseOffset: 500 });
          },
          onEachFeature: (feature, layer) => {
            let text="";
            for(let p in feature.properties){
              text+=`${p}: ${feature.properties[p]}\n`;
            }
            layer.bindPopup(text);
          }
        })
        .on('popupclose', ($event) => {
        })
        return layer;
  }
  
}
