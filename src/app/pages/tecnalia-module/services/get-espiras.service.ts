import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@ngx-config/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetEspirasService {

  private apiURL: any;

  constructor(configService: ConfigService,private http:HttpClient) {
    this.apiURL = configService.getSettings("traffic_prediction_api_base_url");
  }

  getValues(city:string): Observable<any> {
    return this.http.get<any>(`${this.apiURL}/webresources/getEspiras/getLocations/`+city);
  }
}