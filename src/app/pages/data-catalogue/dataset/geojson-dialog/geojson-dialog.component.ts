import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NbDialogRef, NbToastrService } from '@nebular/theme';
import { DCATDistribution } from '../../model/dcatdistribution';
import { DataCataglogueAPIService } from '../../services/data-cataglogue-api.service';
import * as L from "leaflet";
// declare let L;
import * as shp from "shpjs";
import * as toGeoJson from 'togeojson';
import JSZip from 'jszip';
import proj4 from "proj4";

@Component({
  selector: 'ngx-remoteCatalogue-dialog',
  templateUrl: 'geojson-dialog.component.html',
  styleUrls: ['geojson-dialog.component.scss'],
})
export class GeoJsonDialogComponent {

  @Input() title: string;
  distribution: DCATDistribution;
  loading: boolean;
  type: string;

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
    this.loading = true;
    
    if (this.map) {
      this.map.remove(); // Rimuovi la mappa esistente se presente
    }
    const geoJsonData = JSON.parse(data) as GeoJSON.GeoJsonObject;
    console.log(geoJsonData);
    globalThis.file_content = data;

    // Creazione mappa Leaflet
    // cicle to find the attribute coordinates
    let latLng = [0, 0];
    let featuresLenght = Math.floor(geoJsonData['features'].length/2);
    // if(geoJsonData['features'][0]['geometry']['coordinates'] != undefined){
    //   latLng[0] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][1];
    //   latLng[1] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][0];
    // } else if(geoJsonData['features'][0][0]['geometry']['coordinates'] != undefined){
      // latLng[0] += geoJsonData['features'][0][0]['geometry']['coordinates'][1];
      // latLng[1] += geoJsonData['features'][0][0]['geometry']['coordinates'][0];
    // }
    if(typeof geoJsonData['features'][featuresLenght]['geometry']['coordinates'][0] == 'number'){
      latLng[0] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][1];
      latLng[1] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][0];
    } else if(typeof geoJsonData['features'][featuresLenght]['geometry']['coordinates'][0][0] == 'number'){
      latLng[0] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][1];
      latLng[1] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][0];
    } else if(typeof geoJsonData['features'][featuresLenght]['geometry']['coordinates'][0][0][0] == 'number'){
      latLng[0] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)].length/2)][1];
      latLng[1] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)].length/2)][0];
    } else if(typeof geoJsonData['features'][featuresLenght]['geometry']['coordinates'][0][0][0][0] == 'number'){
      latLng[0] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)].length/2)].length/2)][1];
      latLng[1] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)].length/2)].length/2)][0];
    }
    this.map = L.map(this.geoJsonMap.nativeElement).setView(L.latLng(latLng[0], latLng[1]), 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    L.geoJSON(geoJsonData, {
      onEachFeature: this.onEachFeature
    }).addTo(this.map);
    this.loading = false;
  }
  
  openMap(distribution:DCATDistribution){
    if(this.type == 'geojson'){
      if(distribution.downloadURL.includes('.zip') || distribution.downloadURL.includes('.ZIP')){
        this.restApi.downloadZipFromUrl(distribution).subscribe(
          (res : Blob) => {
            res.arrayBuffer().then((buffer) => {
              var zip = new JSZip();
              zip.loadAsync(buffer).then((zip) => {
                zip.forEach((relativePath, zipEntry) => {
                  zipEntry.async('string').then((content) => {
                    this.loadGeoJson(content);
                  }).catch((err) => {
                    console.log(err);
                    this.toastrService.danger("Could not load the file", "Error");
                  });
                });
              })
              .catch((err) => {
                console.log(err);
                this.toastrService.danger("Could not load the file", "Error");
              });
            }).catch((err) => {
              console.log(err);
              this.toastrService.danger("Could not load the file", "Error");
            });
          },
          err => {
            console.log(err);
            this.toastrService.danger("Could not load the file", "Error");
          }
        )
      } else{
        this.restApi.downloadGeoJSONFromUrl(distribution).subscribe(
          (res : string) => {
            console.log(res);
            this.loadGeoJson(JSON.stringify(res))
          },
          err => {
            this.toastrService.danger("Could not load the GeoJSON file", "Error");
          }
        )
      }
    } else if(this.type == 'kml') {
      if(distribution.downloadURL.includes('.zip') || distribution.downloadURL.includes('.ZIP')){
        this.restApi.downloadZipFromUrl(distribution).subscribe(
          (res : Blob) => {
            res.arrayBuffer().then((buffer) => {
              var zip = new JSZip();
              zip.loadAsync(buffer).then((zip) => {
                zip.forEach((relativePath, zipEntry) => {
                  zipEntry.async('string').then((content) => {
                    var kml = new DOMParser().parseFromString(content, 'text/xml');
                    let data = toGeoJson.kml(kml);
                    this.loadGeoJson(JSON.stringify(data));
                  }).catch((err) => {
                    console.log(err);
                    this.toastrService.danger("Could not load the file", "Error");
                  });
                });
              }).catch((err) => {
                console.log(err);
                this.toastrService.danger("Could not load the file", "Error");
              });
            }).catch((err) => {
              console.log(err);
              this.toastrService.danger("Could not load the file", "Error");
            });
          },
          err => {
            console.log(err);
            this.toastrService.danger("Could not load the file", "Error");
          }
        )
      } else{
        this.restApi.downloadKMLFromUrl(distribution).subscribe(
          (res : string) => {
            console.log(res);
            var kml = new DOMParser().parseFromString(res, 'text/xml');
            let data = toGeoJson.kml(kml);
            this.loadGeoJson(JSON.stringify(data))
          },
          err => {
            this.toastrService.danger("Could not load the file", "Error");
          }
        )
      }
    } else if(this.type == 'shp'){
      if(distribution.downloadURL.includes('.zip') || distribution.downloadURL.includes('.ZIP')){

        this.restApi.downloadZipFromUrl(distribution).subscribe(
          (res : Blob) => {
        
            res.arrayBuffer().then((arrayBufferData) => {
              JSZip.loadAsync(arrayBufferData).then((z) => {
        
                let zip = z.file(/.+/);
        
                const names = [];
                const whiteList = [];
                const out1 = {};
        
                zip.map((a) => {
                  let result;
                  if (
                    a.name.slice(-3).toLowerCase() === "shp" ||
                    a.name.slice(-3).toLowerCase() === "dbf"
                  ) {
                    result = a;
                  } else {
                    result = a;
                  }
                  out1[a.name] = result;
                  return out1;
                });
        
                zip = out1 as any;
                const out2 = {};
                const promises = [];
        
                for (const key in zip) {
                  if (key.indexOf("__MACOSX") !== -1) {
                    continue;
                  }
                  if (key.slice(-3).toLowerCase() === "shp") {
                    names.push(key.slice(0, -4));
                    promises.push(
                      zip[key].async("arraybuffer").then((s) => {
                        out2[key.slice(0, -3) + key.slice(-3).toLowerCase()] = s;
                      })
                    );
                  } else if (key.slice(-3).toLowerCase() === "prj") {
                    promises.push(
                      zip[key].async("string").then((s) => {
                        out2[key.slice(0, -3) + key.slice(-3).toLowerCase()] = proj4(s);
                      })
                    );
                  } else if (
                    key.slice(-4).toLowerCase() === "json" ||
                    whiteList.indexOf(key.split(".").pop()) > -1
                  ) {
                    names.push(key.slice(0, -3) + key.slice(-3).toLowerCase());
                  } else if (
                    key.slice(-3).toLowerCase() === "dbf" ||
                    key.slice(-3).toLowerCase() === "cpg"
                  ) {
                    promises.push(
                      zip[key].async("arraybuffer").then((s) => {
                        out2[key.slice(0, -3) + key.slice(-3).toLowerCase()] = s;
                      })
                    );
                  }
                }
        
                Promise.all(promises).then(async (d) => {
                  var features;
                  try {
                    features = shp.combine([
                      shp.parseShp(out2[names + ".shp"], out2[names + ".prj"]),
                      shp.parseDbf(out2[names + ".dbf"])
                    ]);
                  } catch (error) {
                    if ((names.length === 0) && (out2!)) {
                      console.error("not a shape file");
                      this.toastrService.danger("Not a shapefile", "Error");
                      return
                    }
                    features = await this.extractAndDecodeShapefiles(res);
                    this.loadShapeFile(features);
                    return
                  }
        
        
                  this.loadShapeFile(features.features);
                });
              });
            });
          },
          err => {
            console.log(err);
            this.toastrService.danger("Could not load the file", "Error");
          }
        )
      }
    } else {
      this.toastrService.danger("Format not valid", "Error");
    }
  }

  public loadShapeFile(file: any) {

    const geoJsonArray = file;
    console.log('Response Shape File: ' + geoJsonArray);

    if (this.map) {
      this.map.remove();
    }

    const geoJsonData = geoJsonArray[0];
    globalThis.file_content = geoJsonArray[0];

    console.log("DATA");
    console.log(geoJsonData);

    // Creazione mappa Leaflet
    let latLng = [0, 0];
    // let featuresLenght = Math.floor(geoJsonData['features'].length/2);

    if(typeof geoJsonData['geometry']['coordinates'][0] == 'number'){
      latLng[0] += geoJsonData['geometry']['coordinates'][1];
      latLng[1] += geoJsonData['geometry']['coordinates'][0];
    } else if(typeof geoJsonData['geometry']['coordinates'][0][0] == 'number'){
      latLng[0] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][1];
      latLng[1] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][0];
    } else if(typeof geoJsonData['geometry']['coordinates'][0][0][0] == 'number'){
      latLng[0] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)][1];
      latLng[1] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)][0];
    } else if(typeof geoJsonData['geometry']['coordinates'][0][0][0][0] == 'number'){
      latLng[0] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)].length/2)][1];
      latLng[1] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)].length/2)][0];
    }
    
    this.map = L.map(this.geoJsonMap.nativeElement).setView(L.latLng(latLng[0], latLng[1]), 9);

    // if (this.addToBucket.active) {
    //   this.map = L.map(this.geoJsonMap.nativeElement).setView([0, 0], 2);
    // } else if (this.privateBucket.active) {
    //   this.map = L.map(this.geoJsonMapBucket.nativeElement).setView([0, 0], 2);
    // } else if (this.pilotBucket.active) {
    //   this.map = L.map(this.geoJsonMapPilotBucket.nativeElement).setView([0, 0], 2);
    // } else if (this.publicBucket.active) {
    //   this.map = L.map(this.geoJsonMapPublicBucket.nativeElement).setView([0, 0], 2);
    // }

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    geoJsonArray.forEach(geoJson => {
      L.geoJSON(geoJson, {
        // pointToLayer: function (feature, latlng) {
        // return new L.CircleMarker(latlng, {radius: 5, 
        //     fillOpacity: 1, 
        //     color: 'black', 
        //     fillColor: 'blue', 
        //     weight: 1,});
        // },
        onEachFeature: this.onEachFeature
    }
      ).addTo(this.map);
    });

    this.loading = false;
  }
  onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties) {
      // map json properties to popup
      let popupContent = "<p>";
      for (const key in feature.properties) {
        popupContent += "- "+ key + ": " + feature.properties[key] + "<br>";
      }
      popupContent += "</p>";
      layer.bindPopup(popupContent);
    }
  }
  async extractAndDecodeShapefiles(file: Blob): Promise<any> {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    const geoJsonArray = [];
    console.log("sto iterando i file")

    var prjFileName;
    var havePRJ = false;
    var prjFileContent;
    // Itera sui file all'interno del file .zip
    await Promise.all(Object.keys(zipContent.files).map(async (fileName) => {
      try {
        if (fileName.endsWith('.prj')) {
          havePRJ = true;
          const lastDotPRJ = fileName.lastIndexOf('.');
          prjFileName = fileName.slice(0, lastDotPRJ);
          prjFileContent = await zipContent.files[fileName].async('arraybuffer');
          console.log("creato file prj" + fileName);
        }
        if (fileName.endsWith('.shp') || fileName.endsWith('.shx')) {
          const shpFileContent = await zipContent.files[fileName].async('arraybuffer');
          const lastDotSHP = fileName.lastIndexOf('.');
          var shpFileName = fileName.slice(0, lastDotSHP);
          if (havePRJ && prjFileName === shpFileName) {
            const geoJson = await shp.parseShp(shpFileContent, prjFileContent);
            geoJsonArray.push(geoJson);
            havePRJ = false;
          } else {
            const geoJson = await shp.parseShp(shpFileContent);
            geoJsonArray.push(geoJson);
          }
          console.log("aggiunto file shp" + fileName);
        } else if (fileName.endsWith('.dbf')) {
          const dbfFileContent = await zipContent.files[fileName].async('arraybuffer');
          const geoJson = await shp.parseDbf(dbfFileContent);
          console.log("aggiunto file dbf" + fileName);
          geoJsonArray.push(geoJson);
        }
      } catch (error) {
        console.log("error: " + fileName + ": " + error);
      }
    }));
    console.log("raggiunto fine file")

    return geoJsonArray;
  }
}
