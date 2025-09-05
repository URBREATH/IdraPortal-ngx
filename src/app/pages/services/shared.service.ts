import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/*
Manages application state (tokens, embedded status, first-load status)
Decodes and stores JWT tokens
Preserves admin URLs for redirection after authentication
Maintains user session information
*/

export interface SSOMessage {
  embedded: boolean;
  accessToken: string;
  refreshToken: string;
  language?: string; // ISO639-1 two letter code
}

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
  
  // First load and token state management
  private firstLoadSubject = new BehaviorSubject<boolean>(true);
  firstLoad$ = this.firstLoadSubject.asObservable();
  
  private tokenReceivedSubject = new BehaviorSubject<boolean>(false);
  tokenReceived$ = this.tokenReceivedSubject.asObservable();
  
  // Key constants
  private readonly FIRST_LOAD_KEY = 'idra_first_load';
  private readonly TOKEN_KEY = 'serviceToken';
  
  constructor() {
    // Initialize from localStorage on service creation
    this.initializeState();
  }

  private initializeState(): void {
    // Initialize first load state from localStorage
    const firstLoadValue = localStorage.getItem(this.FIRST_LOAD_KEY);
    const isFirstLoad = firstLoadValue === null || firstLoadValue === 'true';
    this.firstLoadSubject.next(isFirstLoad);
    
    // Initialize token state from localStorage
    const token = localStorage.getItem(this.TOKEN_KEY);
    this.tokenReceivedSubject.next(!!token);
    
    if (token) {
      this.ssoToken.next(token);
    }
    
    // Initialize refresh token if present
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      this.refreshToken.next(refreshToken);
    }
  }

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
    
    // Update token received state
    if (ssoMessage.accessToken) {
      this.tokenReceivedSubject.next(true);
      
      // Mark first load as complete
      this.setFirstLoadComplete();
    }
    
    // Also update the language
    this.propagateDialogSelectedLanguage(ssoMessage.language);
  }

  updateEmbeddedState(embedded: boolean) {
    this.embeddedState.next(embedded);
  }

  // First load state management
  isFirstLoad(): boolean {
    return this.firstLoadSubject.value;
  }
  
  setFirstLoadComplete(): void {
    localStorage.setItem(this.FIRST_LOAD_KEY, 'false');
    this.firstLoadSubject.next(false);
  }
  
  isTokenReceived(): boolean {
    return this.tokenReceivedSubject.value;
  }
  
  // URL preservation for admin pages
  private pendingAdminUrl: string | null = null;
  private readonly ADMIN_URL_KEY = 'idra_admin_url';
  
  setPendingAdminUrl(url: string): void {
    // Store in memory
    this.pendingAdminUrl = url;
    // Also store in localStorage for persistence across page reloads
    localStorage.setItem(this.ADMIN_URL_KEY, url);
  }
  
  getPendingAdminUrl(): string | null {
    // First try memory
    let url = this.pendingAdminUrl;
    
    // If not in memory, try localStorage
    if (!url) {
      url = localStorage.getItem(this.ADMIN_URL_KEY);
    }
    
    // Clear storage
    this.pendingAdminUrl = null;
    localStorage.removeItem(this.ADMIN_URL_KEY);
    
    return url;
  }
  
  hasPendingAdminUrl(): boolean {
    return !!(this.pendingAdminUrl || localStorage.getItem(this.ADMIN_URL_KEY));
  }

  // Token access methods
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
