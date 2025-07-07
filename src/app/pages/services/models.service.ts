// ngsi-datasets.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModelsService {
  constructor(private http: HttpClient) {}

  getDatasets(): Observable<any> {
    return this.http.get('/api/models/dataset', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  getSingleEntity(id: string): Observable<any> {
    return this.http.get(`/api/models/entity/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  createDataset(dataset: any) {
    return this.http.post('/api/models/dataset', dataset, {
      responseType: 'text',
      observe: 'response'
    });
  }

  updateDataset(datasetId: string, dataset: any) {
    console.log(JSON.stringify(dataset));
    console.log(datasetId);
    return this.http.patch(`/api/models/dataset/${datasetId}`, dataset, {
      responseType: 'text',
      observe: 'response'
    });
  }

  deleteDataset(datasetId: string) {
    return this.http.delete(`/api/models/dataset/${datasetId}`, {
      responseType: 'text' // Use 'text' if the API returns non-JSON response
    });
  }

  multiDeleteDatasets(datasetIds: string[]) {
    return this.http.post('/api/models/dataset/multi-delete', datasetIds, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  
  getDistributions(): Observable<any> {
    return this.http.get('/api/models/distributiondcatap', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  createDistribution(distribution: any) {
    return this.http.post('/api/models/distributiondcatap', distribution, {
      responseType: 'text',
      observe: 'response'
    });
  }

  deleteDistribution(distributionId: string) {
    return this.http.delete(`/api/models/distribution/${distributionId}`, {
      responseType: 'text' // Use 'text' if the API returns non-JSON response
    });
  }

  updateDistribution(distributionId: string, distribution: any) {
    return this.http.patch(`/api/models/distributiondcatap/${distributionId}`, distribution, {
      responseType: 'text',
      observe: 'response'
    });
  }

}
