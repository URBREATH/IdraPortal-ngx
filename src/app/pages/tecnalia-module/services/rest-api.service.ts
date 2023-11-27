import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@ngx-config/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RestApiService {

  private apiURL: any;

  constructor(configService: ConfigService,private http:HttpClient) {
    this.apiURL = configService.getSettings("tecnalia_api_base_url");
  }

  getValues(): Observable<any> {
    return this.http.get<any>(`${this.apiURL}/Idra/api/v1/administration/version`);
  }


}
