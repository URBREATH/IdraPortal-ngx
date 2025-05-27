import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { OidcJWTToken, UserClaims } from '../oidc/oidc';
import { NbAuthService } from '@nebular/auth';

@Injectable({
  providedIn: 'root'
})
export class OidcUserInformationService {

  user: UserClaims;
  protected user$: BehaviorSubject<any> = new BehaviorSubject(null);

  constructor( private http: HttpClient,
    private authService: NbAuthService,) {

    // this.idmUrl = configService.getSettings("idmBaseURL");
    this.authService.onTokenChange()
      .subscribe((token: OidcJWTToken) => {
        if (token.isValid() && token.getPayload){
          this.user=token.getPayload()
          this.publishUser(this.user)
        }
      });

  }

  getRole(): Observable<string[]> {
    return this.user
    ? (
        this.user.roles != undefined
        ? of(this.user.roles.map(role => role.toUpperCase()))
        : (this.user.realm_access != undefined && this.user.realm_access.roles != undefined
              ? of(this.user.realm_access.roles.map(role => role.toUpperCase()))
              : of(['CITIZEN'])
          )
      )
    : of(['ANONYMOUS']);
  }

  getUser(): Observable<UserClaims> {
    return of(this.user);
  }

  private publishUser(user: any) {
    this.user$.next(user)
  }

  onUserChange(): Observable<any> {
    return this.user$;
  }



}
