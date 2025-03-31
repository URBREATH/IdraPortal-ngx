// ngsi-datasets.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NgsiDatasetsService {
  constructor(private http: HttpClient) {}

  // Return the Observable so the component can subscribe to it
  getDatasets(): Observable<any> {
    return this.http.get('/api/dataset', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }
}
