import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { ConfigService } from '@ngx-config/core';
import { Observable } from 'rxjs';
import { Datalet } from '../data-catalogue/model/datalet';
import { DCATDataset } from '../data-catalogue/model/dcatdataset';
import { DCATDistribution } from '../data-catalogue/model/dcatdistribution';
import { ODMSCatalogue } from '../data-catalogue/model/odmscatalogue';
import { ODMSCatalogueInfo } from '../data-catalogue/model/odmscatalogue-info';
import { ODMSCatalogueResponse } from '../data-catalogue/model/odmscatalogue-response';
import { SearchRequest } from '../data-catalogue/model/search-request';
import { SearchResult } from '../data-catalogue/model/search-result';

@Injectable({
  providedIn: 'root'
})
export class CataloguesServiceService {

  private apiEndpoint;

  constructor(private config:ConfigService,private http:HttpClient) { 
    this.apiEndpoint=this.config.getSettings("idra_base_url");
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

  downloadFromUri(distribution:DCATDistribution):Observable<any>{
    return this.http.get<any>(`${this.apiEndpoint}/Idra/api/v1/client/downloadFromUri?downloadFile=false&url=${encodeURIComponent(distribution.downloadURL)}&id=${distribution.id}`);
  }

  getDatalets(catalogueId:string, datasetId:string, ditributionId:string):Observable<Array<Datalet>>{
    return this.http.get<Array<Datalet>>(`${this.apiEndpoint}/Idra/api/v1/client/catalogues/${catalogueId}/dataset/${datasetId}/distribution/${ditributionId}/datalets`);
  }

  //addODMSNode
  addODMSNode(data:FormData):Observable<SearchResult>{
    return this.http.post<SearchResult>(`${this.apiEndpoint}/Idra/api/v1/administration/catalogues`,data);
  }

  //getAllRemCat
   getAllRemCat():Observable<any>{
    return this.http.get<any>(`${this.apiEndpoint}/Idra/api/v1/administration/remoteCatalogue`);
  }
	//getRemoteNodes
  getRemoteNodesJson():Observable<any>{
    return this.http.get<any>(`http://localhost/catalogue.json`);
  }
	//downloadDump
  getDump(url:string):void{
    window.open(`${this.apiEndpoint}${url}`, "_blank");
  }
}
