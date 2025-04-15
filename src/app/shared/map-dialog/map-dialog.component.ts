import { Component, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import * as L from 'leaflet';
import 'leaflet-draw';


@Component({
  selector: 'app-map-dialog',
  templateUrl: './map-dialog.component.html',
  styleUrls: ['./map-dialog.component.scss']
})
export class MapDialogComponent implements OnInit {
  map: L.Map;
  marker: L.Marker;
  
  constructor(private dialogRef: NbDialogRef<MapDialogComponent>) { }
  
  ngOnInit() {
    setTimeout(() => this.initMap(), 100);
  }
  
  private initMap() {

    // Fix marker icon issue by setting the default icon using CDN URLs
        const iconDefault = L.icon({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          tooltipAnchor: [16, -28],
          shadowSize: [41, 41]
        });
        
        // Assign the default icon to L.Marker.prototype
        L.Marker.prototype.options.icon = iconDefault;

    this.map = L.map('dialog-map').setView([41.902782, 12.496366], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

   // Initialise the FeatureGroup to store editable layers and add them to the map
   var editableLayers = new L.FeatureGroup();
   this.map.addLayer(editableLayers);

   const storedSpatial = localStorage.getItem("dataset_to_edit");
   if (storedSpatial) {
      // Parse the stored spatial data from local storage
      const parsedData = JSON.parse(storedSpatial).spatial;
      // Check the type of the stored spatial data and create the corresponding layer
      if (parsedData.type === "Point") {
        this.marker = L.marker([parsedData.coordinates[1], parsedData.coordinates[0]], { draggable: true }).addTo(editableLayers);
        this.map.setView([parsedData.coordinates[1], parsedData.coordinates[0]], 5);
      } else if (parsedData.type === "Polygon") {
        const latlngs = parsedData.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
        const polygon = L.polygon(latlngs, { color: 'red' }).addTo(editableLayers);
        this.map.fitBounds(polygon.getBounds());
      }
      else if (parsedData.type === "LineString") {
        const latlngs = parsedData.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
        const polyline = L.polyline(latlngs, { color: 'red' }).addTo(editableLayers);
        this.map.fitBounds(polyline.getBounds());
      } 
   }

   // Initialise the draw control and pass it the FeatureGroup of editable layers
   var drawControl = new L.Control.Draw({
     edit: { featureGroup: editableLayers },
     position: "topright",
     draw: {
      rectangle: false,
      circlemarker: false,
       // Configure marker options to use our custom icon
      marker: {
        icon: iconDefault
      }
     },
   });
   this.map.addControl(drawControl);

   //this function gets called whenever we draw something on the map
   this.map.on("draw:created", function (e: any) {
    let drawingLayer = e.layer;
    //and then the drawn layer will get stored in editableLayers
    editableLayers.addLayer(drawingLayer);
  });

    
    // Force map to recalculate its size after being displayed in dialog
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }
  
  
  saveLocation() {

    let newSpatial: object;

    this.map.eachLayer((layer: any) => {
      // Check for Marker type
      if (layer instanceof L.Marker) {
        const latLng = layer.getLatLng();
        newSpatial = {
          type: 'Point',
          coordinates: [latLng.lng, latLng.lat]
        };
      }
      
      // Check for Polyline (but not Polygon, since Polygon extends Polyline)
      else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
        newSpatial = layer.toGeoJSON().geometry;
      }
      
      // Check for Polygon
      else if (layer instanceof L.Polygon) {
        newSpatial = layer.toGeoJSON().geometry;
      }
    });


    //store the new spatial data in local storage
    const datasetToEdit = JSON.parse(localStorage.getItem("dataset_to_edit")) || {};
    datasetToEdit.spatial = newSpatial;
    localStorage.setItem("dataset_to_edit", JSON.stringify(datasetToEdit));

    this.dialogRef.close(true);
  }

  
  close() {
    this.dialogRef.close();
  }
}