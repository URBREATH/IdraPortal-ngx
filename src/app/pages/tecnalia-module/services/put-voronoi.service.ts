import { Injectable } from '@angular/core';
import { ConfigService } from '@ngx-config/core';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

export class PutVoronoiService {
  private apiURL: any;
  private url:string;
  private payload:string;

  constructor(configService: ConfigService,private http:HttpClient) {
    this.apiURL = configService.getSettings("bike_analysis_api_base_url");
    this.url = `${this.apiURL}/webresources/getBikeAnalysis/fromLocationsToVoronoi/`;
  }

  data:any = null;
  
  httpOptions = {
    headers: new HttpHeaders({ 
      'Content-Type': 'application/json;charset=utf-8'

    })
  };
 //headers: new HttpHeaders({'Content-Type': 'application/json'})

  putPoints(payload:string): Observable<any> {
    console.log('PutVoronoiService::: url='+this.url);
    console.log('PutVoronoiService::: payload='+payload);
  return this.http.put<any>(this.url, JSON.stringify(payload), this.httpOptions).pipe(retry(1),catchError(this.httpError));
  //return this.http.put     (this.url, JSON.stringify(payload), this.httpOptions).subscribe(results=>{console.log(results)});
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