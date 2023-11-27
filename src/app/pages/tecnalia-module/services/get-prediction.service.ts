import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@ngx-config/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class GetPredictionService{
  private apiURL: any;
  constructor(configService: ConfigService,private http:HttpClient) {
    this.apiURL = configService.getSettings("traffic_prediction_api_base_url");
  }
  getValues(model_id:string,ddate:string,period:number,type:number,city:string,id:string,num:number): Observable<any> {
    return this.http.get<any>(`${this.apiURL}/webresources/getEspiras/getPrediction/`+model_id+'/'+ddate+"/"+period+"/"+type+"/"+city+"/"+id+"/"+num);
  }
  getValuesCustom(model_id:string,ini:string,end:string,type:number,city:string,id:string,num:number): Observable<any> {
    return this.http.get<any>(`${this.apiURL}/webresources/getEspiras/getPrediction2/`+model_id+'/'+ini+"/"+end+"/"+type+"/"+city+"/"+id+"/"+num);
  }
}
