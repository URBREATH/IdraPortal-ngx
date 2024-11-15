import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from 'ngx-config-json';
import { Observable } from 'rxjs';
import { Datalet } from '../model/datalet';
import { DCATDataset } from '../model/dcatdataset';
import { DCATDistribution } from '../model/dcatdistribution';
import { ODMSCatalogue } from '../model/odmscatalogue';
import { ODMSCatalogueInfo } from '../model/odmscatalogue-info';
import { ODMSCatalogueResponse } from '../model/odmscatalogue-response';
import { SearchRequest } from '../model/search-request';
import { SearchResult } from '../model/search-result';


@Injectable({
  providedIn: 'root'
})
export class DataCataglogueAPIService {

  private apiEndpoint;

  constructor(private config:ConfigService<Record<string, any>>,private http:HttpClient) { 
    this.apiEndpoint=this.config.config["idra_base_url"];
  }

  getDatasetById(id:string):Observable<DCATDataset>{
    return this.http.get<DCATDataset>(`${this.apiEndpoint}/Idra/api/v1/client/datasets/${id}`);
  }

  
  getDataset(catalogueId:number, id:string):Observable<DCATDataset>{
    return this.http.get<DCATDataset>(`${this.apiEndpoint}/Idra/api/v1/client/catalogues/${catalogueId}/datasets/${id}`);
  }

  getDatasets(catalogueId:number):Observable<Array<DCATDataset>>{
    return this.http.get<Array<DCATDataset>>(`${this.apiEndpoint}/Idra/api/v1/client/catalogues/${catalogueId}/datasets`);
  }

  getCatalogue(catalogueId:number):Observable<ODMSCatalogue>{
    return this.http.get<ODMSCatalogue>(`${this.apiEndpoint}/Idra/api/v1/client/catalogues/${catalogueId}`);
  }

  getCatalogues(/*Use the default server query parameter*/):Observable<ODMSCatalogueResponse>{
    return this.http.get<ODMSCatalogueResponse>(`${this.apiEndpoint}/Idra/api/v1/client/catalogues`);
  }

  getCataloguesInfo():Observable<Array<ODMSCatalogueInfo>>{
    return this.http.get<Array<ODMSCatalogueInfo>>(`${this.apiEndpoint}/Idra/api/v1/client/cataloguesInfo`);
  }

  searchDatasets(parameters:SearchRequest):Observable<SearchResult>{
    return this.http.post<SearchResult>(`${this.apiEndpoint}/Idra/api/v1/client/search`,parameters);
  }

  executeSPARQLQuery(query: string, outputFormat: string):Observable<any>{
    return this.http.post<any>(`${this.apiEndpoint}/Idra/api/v1/client/sparql/query`,{query: query, outputFormat: outputFormat});
  }

  downloadFromUri(distribution:DCATDistribution):Observable<any>{
    return this.http.get<any>(`${this.apiEndpoint}/Idra/api/v1/client/downloadFromUri?downloadFile=false&url=${encodeURIComponent(distribution.downloadURL)}&id=${distribution.id}`);
  }

  getDatalets(catalogueId:string, datasetId:string, ditributionId:string):Observable<Array<Datalet>>{
    return this.http.get<Array<Datalet>>(`${this.apiEndpoint}/Idra/api/v1/client/catalogues/${catalogueId}/dataset/${datasetId}/distribution/${ditributionId}/datalets`);
  }

  downloadGeoJSONFromUrl(distribution:DCATDistribution):Observable<any>{
    return this.http.get<any>(`${this.apiEndpoint}/Idra/api/v1/client/downloadFromUri?url=${encodeURIComponent(distribution.downloadURL)}&method=export&format=GeoJSON&id=${distribution.id}`); 
  }

  downloadKMLFromUrl(distribution:DCATDistribution):Observable<any>{
    return this.http.get<any>(`${this.apiEndpoint}/Idra/api/v1/client/downloadFromUri?url=${encodeURIComponent(distribution.downloadURL)}&method=export&format=KML&id=${distribution.id}`, {headers: new HttpHeaders({'Accept': 'application/xml'}), responseType: 'text' as 'json'}); 
  }

  downloadRDFfromUrl(distribution:DCATDistribution):Observable<any>{
    return this.http.get<any>(`${this.apiEndpoint}/Idra/api/v1/client/downloadFromUri?url=${encodeURIComponent(distribution.downloadURL)}&method=export&format=RDF&id=${distribution.id}`, {headers: new HttpHeaders({'Accept': 'application/xml'}), responseType: 'text' as 'json'}); 
  }

  downloadZipFromUrl(distribution:DCATDistribution):Observable<Blob>{
    return this.http.get<Blob>(`${this.apiEndpoint}/Idra/api/v1/client/downloadFromUri?url=${encodeURIComponent(distribution.downloadURL)}&method=export&format=ZIP&id=${distribution.id}`, {headers: new HttpHeaders({'Accept': 'application/zip'}), responseType: 'blob' as 'json'}); 
  }

  downloadShapefileFromUrl(distribution:DCATDistribution):Observable<any>{
    return this.http.get<any>(`${this.apiEndpoint}/Idra/api/v1/client/downloadFromUri?url=${encodeURIComponent(distribution.downloadURL)}&method=export&format=SHP&id=${distribution.id}`, {headers: new HttpHeaders({'Accept': 'x-gis/x-shapefile'}), responseType: 'text' as 'json'}); 
  }
}
