import { Injectable } from '@angular/core';
import { ConfigService } from '@ngx-config/core';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

export class CreateNewbikemodelService{
  private apiURL: any;
  private url:string;
  private payload:any;

  constructor(configService: ConfigService,private http:HttpClient) {
    this.apiURL = configService.getSettings("bike_analysis_api_base_url");
    this.url = `${this.apiURL}/webresources/getBikeAnalysis/createNewModel/`;
  }
  data:any = null;
  httpOptions = {
    headers: new HttpHeaders({ 
      'Content-Type': 'application/json;charset=utf-8',/*
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':'Origin, X-Requested-With, Content-Type, Accept'*/
    })
  };
  createModel(city:string, type:string, num_features:number, ini_date:string, end_date:string, delta_t:number, polys:any ): Observable<any> {
    this.payload = {}
    this.payload['city']           = city;
    this.payload['ini_date']       = ini_date;
    this.payload['end_date']       = end_date;
    this.payload['polys']          = polys;
    this.payload['inference_type'] = type;
    this.payload['num_features']   = num_features;
    this.payload['delta_t']        = delta_t;
    return this.http.put<any>(this.url, this.payload, this.httpOptions).pipe(retry(1),catchError(this.httpError));
  
  }
  httpError(error:any) {
    let msg = '';
    if(error.error instanceof ErrorEvent) {
      msg = error.error.message;
    } else {
      msg = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.log(msg);
    return throwError(msg);
  }
}