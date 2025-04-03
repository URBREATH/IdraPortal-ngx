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

  postDataset(dataset: any) {
    return this.http.post('/api/dataset', dataset, {
      responseType: 'text',  // <-- This tells Angular not to parse as JSON
      observe: 'response'    // <-- Optional: to get the full response including headers
    });
  }

  deleteDataset(datasetId: string) {
    return this.http.delete(`/api/dataset/${datasetId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  multiDeleteDatasets(datasetIds: string[]) {
    return this.http.post('/api/dataset/multi-delete', datasetIds, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }


}
