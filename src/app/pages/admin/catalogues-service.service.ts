import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';
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
import { NbGlobalPhysicalPosition, NbToastRef, NbToastrService } from '@nebular/theme';
import * as FileSaver from 'file-saver';
import { ODMSCatalogueComplete } from '../data-catalogue/model/odmscataloguecomplete';
import { ODMSCatalogueNode } from '../data-catalogue/model/odmscatalogue-node';
import { ConfigurationManagement } from '../data-catalogue/model/configurations';
import { Prefixes } from '../data-catalogue/model/prefixes';
import { RemoteCatalogues } from '../data-catalogue/model/remote-catalogues';

@Injectable({
  providedIn: 'root'
})
export class CataloguesServiceService {

  private apiEndpoint;
  private mqaEndpoint;
  private mqaDockerEndpoint;

  constructor(private config:ConfigService,private http:HttpClient,
    private toastr: NbToastrService) { 
      this.apiEndpoint=this.config.getSettings("idra_base_url");
      this.mqaEndpoint=this.config.getSettings("mqa_base_url");
      this.mqaDockerEndpoint=this.config.getSettings("mqa_docker_url");
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

  //modODMSNode
  modODMSNode(data:FormData, id: string):Observable<SearchResult>{
    return this.http.put<SearchResult>(`${this.apiEndpoint}/Idra/api/v1/administration/catalogues/`+id,data);
  }
  //modODMSNode
  getODMSNode(catalogueId:number):Observable<ODMSCatalogueNode>{
    return this.http.get<ODMSCatalogueNode>(`${this.apiEndpoint}/Idra/api/v1/administration/catalogues/${catalogueId}?withImage=true`);
  }

  //getAllRemCat
   getAllRemCat():Observable<any>{
    return this.http.get<any>(`${this.apiEndpoint}/Idra/api/v1/administration/remoteCatalogue`);
  }
	//getRemoteNodes
  getRemoteNodesJson():Observable<any>{
    return this.http.get<any>(`http://localhost/catalogue.json`);
  }





  getAllCataloguesInfo():Observable<Array<ODMSCatalogueComplete>>{
    return this.http.get<Array<ODMSCatalogueComplete>>(`${this.apiEndpoint}/Idra/api/v1/administration/catalogues?withImage=false`);
  }

  
  getConfigurationManagement():Observable<Array<ConfigurationManagement>>{
    return this.http.get<Array<ConfigurationManagement>>(`${this.apiEndpoint}/Idra/api/v1/administration/configuration`);
  }

  activeCatalogue(id:string):Promise<any>{
    return new Promise((resolve,reject)=>{
      this.http.put<any>(`${this.apiEndpoint}/Idra/api/v1/administration/catalogues/${id}/activate`, null)
      .subscribe((data: any) => {
        resolve(data)
        return data
      }, error => {
        reject(error)
        return error
      })
    })
  }

  deactiveCatalogue(id:string, keepDatasets:boolean):Promise<any>{
    return new Promise((resolve,reject)=>{
      this.http.put<any>(`${this.apiEndpoint}/Idra/api/v1/administration/catalogues/${id}/deactivate?keepDatasets=`+keepDatasets, null)
      .subscribe((data: any) => {
        resolve(data)
        return data
      }, error => {
        reject(error)
        return error
      })
    })
  }

  deleteCatalogue(id:string):Promise<any>{
    return new Promise((resolve,reject)=>{
      this.http.delete<any>(`${this.apiEndpoint}/Idra/api/v1/administration/catalogues/${id}`)
      .subscribe((data: any) => {
        resolve(data)
        return data
      }, error => {
        reject(error)
        return error
      })
    })
  }
  
	//downloadDump
  async getDump(url:string, name : string):Promise<void>{
    // window.open(`${this.apiEndpoint}${url}`, "_blank");
    this.http.get(`${this.apiEndpoint}${url}`, { responseType: 'blob' })
      .subscribe((resp: any) => {
          FileSaver.saveAs(resp, 'Dump_'+name+ '.rdf')
      });
  }

  syncRemoteCatalogue(id:string):Promise<any>{
    
    return new Promise((resolve,reject)=>{
      this.http.post<any>(`${this.apiEndpoint}/Idra/api/v1/administration/catalogues/${id}/synchronize`,null)
      .subscribe((data: any) => {
        resolve(data)
        return data
      }, error => {
        reject(error)
        return error
      })
    })
  }
  
  async submitAnalisysJSON(id: String): Promise<any> {
    
    const token = localStorage.getItem('token');

    let json = {
      "file_url": `${this.apiEndpoint}/Idra/api/v1/administration/dcat-ap/dump/`+id,  //da cambiare
      "token": token
    }
    return new Promise((resolve,reject)=>{
      this.http.post(`${this.mqaDockerEndpoint}/submit/auth`, json, {
        headers: {
          'Content-Type':  'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST',
        },
      },
      
      )
      .subscribe((data: any) => {
        this.toastr.show('Analisys submitted', 'Success', { status: 'success', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
        
        resolve(data)
        return data
      }, error => {
        this.toastr.show("There was an error", 'Error', { status: 'danger', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
        
        reject(error)
        return error
      })
    })
  }

  updateConfiguration(json: any): Observable<any> {
    return this.http.post<any>(`${this.apiEndpoint}/Idra/api/v1/administration/configuration`, json);  
  }

  updatePassword(json: any): Observable<any> {
    return this.http.put<any>(`${this.apiEndpoint}/Idra/api/v1/administration/updatePassword`, json);
  }

  listPrefixes(): Observable<Prefixes> {
    return this.http.get<Prefixes>(`${this.apiEndpoint}/Idra/api/v1/administration/prefixes`);
  }

  createPrefix(json: any): Observable<any> {
    return this.http.post<any>(`${this.apiEndpoint}/Idra/api/v1/administration/prefixes`, json);
  }

  deletePrefix(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiEndpoint}/Idra/api/v1/administration/prefixes/${id}`);
  }

  modifyPrefix(json: any, id: string): Observable<any> {
    return this.http.put<any>(`${this.apiEndpoint}/Idra/api/v1/administration/prefixes/${id}`, json);
  }

  listRemoteCatalogues(): Observable<RemoteCatalogues> {
    return this.http.get<RemoteCatalogues>(`${this.apiEndpoint}/Idra/api/v1/administration/remoteCatalogue`);
  }

  createRemoteCatalogue(json: any): Observable<any> {
    return this.http.post<any>(`${this.apiEndpoint}/Idra/api/v1/administration/remoteCatalogue`, json);
  }

  modifyRemoteCatalogue(json: any, id: string): Observable<any> {
    return this.http.put<any>(`${this.apiEndpoint}/Idra/api/v1/administration/remoteCatalogue/${id}`, json);
  }

  deleteRemoteCatalogue(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiEndpoint}/Idra/api/v1/administration/remoteCatalogue/${id}`);
  }

  listDatalets(): Observable<Datalet> {
    return this.http.get<Datalet>(`${this.apiEndpoint}/Idra/api/v1/administration/datalets`);
  }

  deleteDatalet(id: string, nodeID: string, datasetID: string, distributionID: string): Observable<any> {
    return this.http.delete<any>(`${this.apiEndpoint}/Idra/api/v1/administration/catalogues/${nodeID}/dataset/${datasetID}/distribution/${distributionID}/deleteDatalet/${id}`);
  }
}
