import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '@ngx-config/core';
import { IDMUser } from '../oauth/model/idmuser';
import { NbRoleProvider } from '@nebular/security';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class KeyrockUserInformationService {
  apiURL: string;
  client_id: string;
  constructor(configService: ConfigService, private http: HttpClient) {
    this.apiURL = configService.getSettings("idmBaseURL");
    this.client_id = configService.getSettings("client_id");
  }

  getRole(): Observable<string[]> {

    return this.getUser().pipe(
      map(x => {
        if (x.roles.length != 0) {
          return x.roles.map(y => y.name.toUpperCase());
        } else {
          return ["CITIZEN"];
        }
      })
    );
  }

  getUser(): Observable<IDMUser> {
    return this.http.get<IDMUser>(`${this.apiURL}/user`);
  }

  getLogoutUrl(): string {
    return `${this.apiURL}/auth/external_logout?_method=DELETE&client_id=${this.client_id}`;
  }
}
