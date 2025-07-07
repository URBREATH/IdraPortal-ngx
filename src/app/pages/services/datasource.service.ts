// ngsi-datasets.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatasourceService {
  constructor(private http: HttpClient) {}

  getDatasets(): Observable<any> {
    return this.http.get('/api/datasource/dataset', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  getSingleEntity(id: string): Observable<any> {
    return this.http.get(`/api/datasource/entity/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  createDataset(dataset: any) {
    return this.http.post('/api/datasource/dataset', dataset, {
      responseType: 'text',
      observe: 'response'
    });
  }

  updateDataset(datasetId: string, dataset: any) {
    console.log(JSON.stringify(dataset));
    console.log(datasetId);
    return this.http.patch(`/api/datasource/dataset/${datasetId}`, dataset, {
      responseType: 'text',
      observe: 'response'
    });
  }

  deleteDataset(datasetId: string) {
    return this.http.delete(`/api/datasource/dataset/${datasetId}`, {
      responseType: 'text' // Use 'text' if the API returns non-JSON response
    });
  }

  multiDeleteDatasets(datasetIds: string[]) {
    return this.http.post('/api/datasource/dataset/multi-delete', datasetIds, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  
  getDistributions(): Observable<any> {
    return this.http.get('/api/datasource/distributiondcatap', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  createDistribution(distribution: any) {
    return this.http.post('/api/datasource/distributiondcatap', distribution, {
      responseType: 'text',
      observe: 'response'
    });
  }

  deleteDistribution(distributionId: string) {
    return this.http.delete(`/api/datasource/distribution/${distributionId}`, {
      responseType: 'text' // Use 'text' if the API returns non-JSON response
    });
  }

  updateDistribution(distributionId: string, distribution: any) {
    return this.http.patch(`/api/datasource/distributiondcatap/${distributionId}`, distribution, {
      responseType: 'text',
      observe: 'response'
    });
  }

}
