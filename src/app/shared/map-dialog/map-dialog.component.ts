import { Component, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-dialog',
  templateUrl: './map-dialog.component.html',
  styleUrls: ['./map-dialog.component.scss']
})
export class MapDialogComponent implements OnInit {
  private map: L.Map;
  private marker: L.Marker;
  selectedLocation: [number, number] = [0, 0];
  
  constructor(private dialogRef: NbDialogRef<MapDialogComponent>) { }
  
  ngOnInit() {
    setTimeout(() => this.initMap(), 100);
  }
  
  private initMap() {
    this.map = L.map('dialog-map').setView([41.902782, 12.496366], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setMarker(e.latlng.lat, e.latlng.lng);
    });
    
    // Force map to recalculate its size after being displayed in dialog
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
  }
  
  private setMarker(lat: number, lng: number) {
    this.selectedLocation = [lng, lat]; // Note: GeoJSON format is [longitude, latitude]
    
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng]).addTo(this.map);
    }
  }
  
  saveLocation() {
    this.dialogRef.close(this.selectedLocation);
  }
  
  close() {
    this.dialogRef.close();
  }
}