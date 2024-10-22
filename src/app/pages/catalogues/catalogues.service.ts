import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NbGlobalPhysicalPosition, NbToastRef, NbToastrService } from '@nebular/theme';
import { ConfigService } from 'ngx-config-json';

@Injectable({
  providedIn: 'root'
})
export class CataloguesService {

    private apiEndpoint;

  constructor(
    private http: HttpClient,
    private toastr: NbToastrService,
    private config:ConfigService<Record<string, any>>
  ) {
    this.apiEndpoint=this.config.config["idra_base_url"];
  }

  getCatalogueList(): any {
    return new Promise((resolve,reject)=>{
      this.http.get(`${this.apiEndpoint}/Idra/api/v1/client/catalogues?withImage=true&orderBy=name&orderType=asc`, {
        headers: {
          'Content-Type':  'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET',
        },
      },)
      .subscribe((data: any) => {
        resolve(data)
        return data
      }, error => {
        const toastRef: NbToastRef = this.toastr.show("There was an error", 'Error', { status: 'danger', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
        
        reject(error)
        return error
      })
    })
  }

}
