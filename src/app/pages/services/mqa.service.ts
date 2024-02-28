import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NbGlobalPhysicalPosition, NbToastRef, NbToastrService } from '@nebular/theme';

@Injectable({
  providedIn: 'root'
})
export class MqaService {

  constructor(
    private http: HttpClient,
    private toastr: NbToastrService
  ) { }

  getOne(id: String): any {
    return new Promise((resolve,reject)=>{
      this.http.get('http://localhost:8000/get/analisys/'+id, {
        headers: {
          'Content-Type':  'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET',
        },
      },
      
      )
      .subscribe((data: any) => {
        if(data?.created_at != null){
          const toastRef: NbToastRef = this.toastr.show('Found results', 'Success', { status: 'success', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
        } else {
          const toastRef: NbToastRef = this.toastr.show('Analisys is not yet completed, no score found, please try again later', 'Warning', { status: 'warning', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
        }
        resolve(data)
        return data
      }, error => {
        const toastRef: NbToastRef = this.toastr.show(error, 'Error', { status: 'danger', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
        
        reject(error)
        return error
      })
    })
  }

  deleteOne(id: String): any {
    return new Promise((resolve,reject)=>{
      this.http.delete('http://localhost:8000/delete/element/'+id, {
        headers: {
          'Content-Type':  'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET',
        },
      },
      
      )
      .subscribe((data: any) => {
        const toastRef: NbToastRef = this.toastr.show('Deleted successfully', 'Success', { status: 'success', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
        
        resolve(data)
        return data
      }, error => {
        const toastRef: NbToastRef = this.toastr.show("There was an error", 'Error', { status: 'danger', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
        
        reject(error)
        return error
      })
    })
  }
    
    getFiltered(id: String, jsonData : Object): any {
      return new Promise((resolve,reject)=>{
        this.http.post('http://localhost:8000/get/analisys/'+id, jsonData, {
          headers: {
            'Content-Type':  'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST',
          },
        },
        
        )
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

    getAll(): any {
      return new Promise((resolve,reject)=>{
        this.http.get('http://localhost:8000/get/all', {
          headers: {
            'Content-Type':  'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET',
          },
        },
        
        )
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


    async submitAnalisysJSON(xml: String): Promise<any> {
      let json = {
        "file_url": xml,
      }
      return new Promise((resolve,reject)=>{
        this.http.post('http://localhost:8000/submit', json, {
          headers: {
            'Content-Type':  'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST',
          },
        },
        
        )
        .subscribe((data: any) => {
          const toastRef: NbToastRef = this.toastr.show('Analisys submitted', 'Success', { status: 'success', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
          
          resolve(data)
          return data
        }, error => {
          const toastRef: NbToastRef = this.toastr.show("There was an error", 'Error', { status: 'danger', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
          
          reject(error)
          return error
        })
      })
    }

    async submitAnalisysFile(rdf: File): Promise<any> {
      let fd = new FormData();
      fd.append("file", rdf);
      
      return new Promise((resolve,reject)=>{
        this.http.post('http://localhost:8000/submit/file', fd, {
        },
        
        )
        .subscribe((data: any) => {
          const toastRef: NbToastRef = this.toastr.show('Analisys submitted', 'Success', { status: 'success', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
          
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
