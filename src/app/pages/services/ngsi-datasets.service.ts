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
    return this.http.get('/api/datasetngsi/dataset', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  getSingleEntity(id: string): Observable<any> {
    return this.http.get(`/api/datasetngsi/entity/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  createDataset(dataset: any) {
    return this.http.post('/api/datasetngsi/dataset', dataset, {
      responseType: 'text',
      observe: 'response'
    });
  }

  updateDataset(datasetId: string, dataset: any) {
    console.log(JSON.stringify(dataset));
    console.log(datasetId);
    return this.http.patch(`/api/datasetngsi/dataset/${datasetId}`, dataset, {
      responseType: 'text',
      observe: 'response'
    });
  }

  deleteDataset(datasetId: string) {
    return this.http.delete(`/api/datasetngsi/dataset/${datasetId}`, {
      responseType: 'text' // Use 'text' if the API returns non-JSON response
    });
  }

  multiDeleteDatasets(datasetIds: string[]) {
    return this.http.post('/api/datasetngsi/dataset/multi-delete', datasetIds, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  
  getDistributions(): Observable<any> {
    return this.http.get('/api/datasetngsi/distributiondcatap', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  }

  createDistribution(distribution: any) {
    return this.http.post('/api/datasetngsi/distributiondcatap', distribution, {
      responseType: 'text',
      observe: 'response'
    });
  }

  deleteDistribution(distributionId: string) {
    return this.http.delete(`/api/datasetngsi/distribution/${distributionId}`, {
      responseType: 'text' // Use 'text' if the API returns non-JSON response
    });
  }

  updateDistribution(distributionId: string, distribution: any) {
    return this.http.patch(`/api/datasetngsi/distributiondcatap/${distributionId}`, distribution, {
      responseType: 'text',
      observe: 'response'
    });
  }

  uploadDistributionFile(file: File, endpoint: string = '/api/datasetngsi/distribution/upload') {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(endpoint, formData);
  }

}
