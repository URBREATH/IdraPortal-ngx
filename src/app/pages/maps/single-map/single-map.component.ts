import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import * as L from 'leaflet';

import AMTram2020 from '../../../../assets/map/am_tram_2020.json';
import AMTram2018 from '../../../../assets/map/am_tram_2018.json';

@Component({
  selector: 'ngx-single-map',
  styleUrls: ['./single-map.component.scss'],
  template: `
  <div class="row d-flex justify-content-between align-items-center">
  <nb-card class="col-12">
    <nb-card-header>Tram 2018-2020</nb-card-header>
    <nb-card-body>
      <div leaflet #map 
      [leafletOptions]="options" 
      (leafletMapReady)="onMapReady($event)"
      >
    </div>
      <div class="mt-1">
        <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
        </p>
      </div>
      <nb-radio-group  [(ngModel)]="topLayer" (valueChange)="setLayerToFront($event)" layout="row">
        <nb-radio value="2020">Tram 2020</nb-radio>
        <nb-radio value="2018">Tram 2018</nb-radio>
      </nb-radio-group>
    </nb-card-body>
  </nb-card>
  </div>`
})
export class SingleMapComponent implements OnInit {

  public map: L.Map;

  icon = new L.Icon({
    iconSize: [25, 41],
    iconAnchor: [13, 41],
    iconUrl: 'assets/img/markers/marker-icon.png',
    iconRetinaUrl: 'assets/img/markers/marker-icon-2x.png',
    shadowUrl: 'assets/img/markers/marker-shadow.png'
  });

  topLayer = "2020";

  options = {
    layers: [
      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' }),
    ],
    zoom: 9,
    center: L.latLng({ lat: 52.372664783594274, lng: 4.8950958251953125 }),
  };

  layer2020: L.GeoJSON;
  layer2018: L.GeoJSON;

  constructor(private cdRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.layer2020 = this.getLayer('2020', <any>AMTram2020);
    this.layer2018 = this.getLayer('2018', <any>AMTram2018);
  }

  onMapReady(map: L.Map) {
    this.map = map;
    setTimeout(() => {
      this.map.invalidateSize();
      this.map.addLayer(this.layer2018);
      this.map.addLayer(this.layer2020);
      this.map.fitBounds(this.layer2020.getBounds(), {
        padding: [50, 50]
      });
    }, 50);

  }

  public getLayer(title, l): L.GeoJSON {

    let layer = L.geoJSON(l,
      {
        onEachFeature: (feature, layer) => {
          let text = "";
          for (let p in feature.properties) {
            text += `${p}: ${feature.properties[p]}\n`;
          }
          layer.bindPopup(text);
        },
        style: function () {
          if (title == '2020')
            return { color: '#248175', weight: 7, opacity: 0.8 }
          else
            return { color: "#242c81", weight: 5, opacity: 0.8 }
        }
      },
    )
      .on('popupclose', ($event) => {
      })

    layer['_id'] = title;
    return layer;
  }

  setLayerToFront($event) {
    this.map.removeLayer(this.layer2018)
    this.map.removeLayer(this.layer2020)
    if ($event == "2018") {
      this.map.addLayer(this.layer2020)
      this.map.addLayer(this.layer2018)
    } else {
      this.map.addLayer(this.layer2018)
      this.map.addLayer(this.layer2020)
    }

    this.map.invalidateSize()
    this.cdRef.detectChanges()
  }

}

