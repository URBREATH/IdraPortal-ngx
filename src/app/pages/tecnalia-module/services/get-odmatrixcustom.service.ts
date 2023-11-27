import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@ngx-config/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetOdmatrixcustomService {
  private apiURL: any;
  constructor(configService: ConfigService,private http:HttpClient) {
    this.apiURL = configService.getSettings("bike_analysis_api_base_url");
  }
  getMatrix(city:string, inference_type:number, num_areas:number, model_id:string,dateS:string,period:number,num:number,delta_t:number): Observable<any> {
    console.log('GetOdmatrixcustomService.getMatrix::: NOT IMPLEMENTED!!!!')
    return null;
  }
}