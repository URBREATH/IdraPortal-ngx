import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SSOMessage } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private dialogSelectedLanguage = new BehaviorSubject<string>(null);
  dialogSelectedLanguage$ = this.dialogSelectedLanguage.asObservable();
  
  // SSO and embedded state management
  private embeddedState = new BehaviorSubject<boolean>(false);
  embeddedState$ = this.embeddedState.asObservable();
  
  private ssoToken = new BehaviorSubject<string>(null);
  ssoToken$ = this.ssoToken.asObservable();
  
  private refreshToken = new BehaviorSubject<string>(null);
  refreshToken$ = this.refreshToken.asObservable();
  
  private languageSubject = new BehaviorSubject<string>('en');
  language$ = this.languageSubject.asObservable();
  
  constructor() { }

  onLanguageChange() {
    return this.languageSubject.asObservable();
  }

  propagateDialogSelectedLanguage(dialogSelectedLanguage: string) {
    this.dialogSelectedLanguage.next(dialogSelectedLanguage)
    this.languageSubject.next(dialogSelectedLanguage);
  }

  // SSO and embedded state management methods
  updateSSOData(ssoMessage: SSOMessage) {
    this.embeddedState.next(ssoMessage.embedded);
    this.ssoToken.next(ssoMessage.accessToken);
    this.refreshToken.next(ssoMessage.refreshToken);
    
    // Also update the language
    this.propagateDialogSelectedLanguage(ssoMessage.language);
  }

  updateEmbeddedState(embedded: boolean) {
    this.embeddedState.next(embedded);
  }

  getSSOToken(): string | null {
    return this.ssoToken.value;
  }

  getRefreshToken(): string | null {
    return this.refreshToken.value;
  }

  isEmbedded(): boolean {
    return this.embeddedState.value;
  }

  // JWT token decoding utility
  decodeJWTToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      return decoded;
    } catch (error) {
      console.error('SharedService: Error decoding JWT token:', error);
      return null;
    }
  }

  // Get user roles from decoded JWT token
  getUserRoles(): string[] {
    const token = this.getSSOToken();
    if (token) {
      const decoded = this.decodeJWTToken(token);
      if (decoded) {
        // Common JWT claims for roles (adjust based on your JWT structure)
        const roles = decoded.roles || decoded.realm_access?.roles || decoded.resource_access?.roles || [];
        return roles;
      }
    }
    return [];
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const userRoles = this.getUserRoles();
    return userRoles.includes(role);
  }

  // Get user information from decoded JWT token
  getUserInfo(): any {
    const token = this.getSSOToken();
    if (token) {
      const decoded = this.decodeJWTToken(token);
      if (decoded) {
        const userInfo = {
          username: decoded.preferred_username || decoded.sub || decoded.username,
          email: decoded.email,
          name: decoded.name || decoded.given_name + ' ' + decoded.family_name,
          roles: this.getUserRoles(),
          exp: decoded.exp,
          iat: decoded.iat
        };
        return userInfo;
      }
    }
    return null;
  }
}
