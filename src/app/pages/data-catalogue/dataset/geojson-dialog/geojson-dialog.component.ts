import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NbDialogRef, NbToastrService } from '@nebular/theme';
import { DCATDistribution } from '../../model/dcatdistribution';
import { DataCataglogueAPIService } from '../../services/data-cataglogue-api.service';
import "leaflet";
declare let L;
import * as toGeoJson from 'togeojson';

@Component({
  selector: 'ngx-remoteCatalogue-dialog',
  templateUrl: 'geojson-dialog.component.html',
  styleUrls: ['geojson-dialog.component.scss'],
})
export class GeoJsonDialogComponent {

  @Input() title: string;
  distribution: DCATDistribution;
  loading: boolean;
  type: boolean; // true = GeoJSON, false = KML

  constructor(protected ref: NbDialogRef<GeoJsonDialogComponent>,
    private restApi: DataCataglogueAPIService,
    private toastrService: NbToastrService,
) {}

  ngOnInit() {
    this.loading = true;
    this.openMap(this.distribution);
  }

  map: any;
  @ViewChild('geoJsonMap', { static: false }) geoJsonMap: ElementRef;
  private loadGeoJson(data: string): void {
    if (this.map) {
      this.map.remove(); // Rimuovi la mappa esistente se presente
    }
    const geoJsonData = JSON.parse(data) as GeoJSON.GeoJsonObject;

    globalThis.file_content = data;

    // Creazione mappa Leaflet
    let latLng = [geoJsonData['features'][0]['geometry']['coordinates'][0][1], geoJsonData['features'][0]['geometry']['coordinates'][0][0]];
    this.map = L.map(this.geoJsonMap.nativeElement).setView(latLng, 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    L.geoJSON(geoJsonData).addTo(this.map);
    this.loading = false;
  }
  
  openMap(distribution:DCATDistribution){
    if(this.type){
      this.restApi.downloadGeoJSONFromUrl(distribution).subscribe(
        (res : string) => {
          this.loadGeoJson(JSON.stringify(res));
        },
        err => {
          console.log(err)
          this.toastrService.danger("Could not load the GeoJSON file", "Error");
        }
      )
    } else {
      this.restApi.downloadKMLFromUrl(distribution).subscribe(
        (res : string) => {
          var kml = new DOMParser().parseFromString(res, 'text/xml');
          let data = toGeoJson.kml(kml);
          this.loadGeoJson(JSON.stringify(data));
        },
        err => {
          this.toastrService.danger("Could not load the file", "Error");
        }
      )
    }
  }
}
