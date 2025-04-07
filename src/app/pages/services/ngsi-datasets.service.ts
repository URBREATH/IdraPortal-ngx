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

  createDataset(dataset: any) {
    return this.http.post('/api/dataset', dataset, {
      responseType: 'text',
      observe: 'response'
    });
  }

  deleteDataset(datasetId: string) {
    return this.http.delete(`/api/dataset/${datasetId}`, {
      responseType: 'text' // Use 'text' if the API returns non-JSON response
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

  
  getDistributions(): Observable<any> {
    return this.http.get('/api/distributiondcatap', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  createDistribution(distribution: any) {
    return this.http.post('/api/distributiondcatap', distribution, {
      responseType: 'text',
      observe: 'response'
    });
  }

  deleteDistribution(distributionId: string) {
    return this.http.delete(`/api/distribution/${distributionId}`, {
      responseType: 'text' // Use 'text' if the API returns non-JSON response
    });
  }

}
