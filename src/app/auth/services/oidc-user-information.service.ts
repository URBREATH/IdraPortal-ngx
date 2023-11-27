import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ConfigService } from '@ngx-config/core';
import { OidcJWTToken, UserClaims } from '../oidc/oidc';
import { of as observableOf } from 'rxjs/observable/of';
import { NbAuthService } from '@nebular/auth';

@Injectable({
  providedIn: 'root'
})
export class OidcUserInformationService {

  user: UserClaims;
  protected user$: BehaviorSubject<any> = new BehaviorSubject(null);

  constructor(configService: ConfigService, private http: HttpClient,
    private authService: NbAuthService,) {

    // this.idmUrl = configService.getSettings("idmBaseURL");
    this.authService.onTokenChange()
      .subscribe((token: OidcJWTToken) => {
        if (token.isValid()){
          this.user=token.getAccessTokenPayload()
          this.publishUser(this.user)
        }
      });

  }

  getRole(): Observable<string[]> {
    return this.user ? observableOf(this.user.roles.map(role => role.toUpperCase())) : observableOf(['CITIZEN']);
  }

  getUser(): Observable<UserClaims> {
    return observableOf(this.user);
  }


  private publishUser(user: any) {
    this.user$.next(user)
  }

  onUserChange(): Observable<any> {
    return this.user$;
  }

}
