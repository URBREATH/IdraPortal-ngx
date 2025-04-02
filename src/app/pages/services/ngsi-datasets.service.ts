// ngsi-datasets.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NgsiDatasetsService {
  constructor(private http: HttpClient) {}

  getDatasets(): Observable<any> {
    return this.http.get('/api/dataset', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  // Nuovo metodo per inviare il dataset in POST a /api/dataset
  postDataset(payload: any): Observable<any> {
    return this.http.post('/api/dataset', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }
}
