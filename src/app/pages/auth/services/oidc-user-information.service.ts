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

  constructor(private http: HttpClient, private authService: NbAuthService) {
    this.authService.onTokenChange()
      .subscribe((token: any) => { // Changed from OidcJWTToken to any
        if (token && token.isValid()) {
          console.log('OidcUserInformationService: Token received, type:', token.constructor.name);
          
          // Check if token has getAccessTokenPayload method (OAuth2 JWT tokens)
          if (typeof token.getAccessTokenPayload === 'function') {
            console.log('OidcUserInformationService: Using getAccessTokenPayload()');
            this.user = token.getAccessTokenPayload();
          } 
          // Check if token has getPayload method (regular JWT tokens)
          else if (typeof token.getPayload === 'function') {
            console.log('OidcUserInformationService: Using getPayload()');
            this.user = token.getPayload();
          }
          // Fallback: try to extract payload directly from token
          else {
            console.log('OidcUserInformationService: Extracting payload manually');
            this.user = this.extractTokenPayload(token);
          }
          
          if (this.user) {
            console.log('OidcUserInformationService: User payload extracted:', this.user);
            this.publishUser(this.user);
          } else {
            console.warn('OidcUserInformationService: Could not extract user payload from token');
          }
        } else {
          console.log('OidcUserInformationService: Invalid or missing token');
          this.user = null;
          this.publishUser(null);
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

  // Add this helper method to extract payload manually:
  private extractTokenPayload(token: any): UserClaims | null {
    try {
      // Try to get the raw token value
      let tokenValue = token.getValue ? token.getValue() : token.token;
      
      // If it's an object with access_token property
      if (typeof tokenValue === 'object' && tokenValue.access_token) {
        tokenValue = tokenValue.access_token;
      }
      
      // Decode JWT manually
      if (typeof tokenValue === 'string') {
        const parts = tokenValue.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          return payload;
        }
      }
      
      return null;
    } catch (error) {
      console.error('OidcUserInformationService: Error extracting token payload:', error);
      return null;
    }
  }
}
