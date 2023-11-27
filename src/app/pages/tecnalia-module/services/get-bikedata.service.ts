import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@ngx-config/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetBikedataService {
  private apiURL: any;
  constructor(configService: ConfigService,private http:HttpClient) {
    this.apiURL = configService.getSettings("bike_analysis_api_base_url");
  }
  getValues(city:string): Observable<any> {
    return this.http.get<any>(`${this.apiURL}/webresources/getBikeAnalysis/getBikeData/`+city);
  }
}