import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@ngx-config/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class CreateNewmodelService{
  private apiURL: any;
  
  constructor(configService: ConfigService,private http:HttpClient) {
    this.apiURL = configService.getSettings("traffic_prediction_api_base_url");
  }
  
  createModel(city:string,id:string, type:string, num_features:number, ini_date:string, end_date:string, prct:number ): Observable<any> {
    return this.http.get<any>(`${this.apiURL}/webresources/getEspiras/createNewModel/`+city+'/'+id+'/'+type+'/'+num_features+'/'+ini_date+'/'+end_date+'/'+prct);
  }
}