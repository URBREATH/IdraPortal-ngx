import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { NbAuthService, NbAuthResult, NbAuthOAuth2JWTToken } from '@nebular/auth';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { ConfigService } from 'ngx-config-json';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from '../../../pages/services/shared.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'nb-playground-oauth2-callback',
  template: ``,
})
export class AuthCallbackComponent implements OnDestroy, OnInit {

  private destroy$ = new Subject<void>();

  constructor(
    private authService: NbAuthService, 
    private router: Router, 
    private config: ConfigService<Record<string, any>>,
    public translateService: TranslateService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    // Check if we're in embedded mode and have received SSO data
    this.checkForEmbeddedAuth();
  }

  private checkForEmbeddedAuth() {
    // Listen for SSO messages from parent window
    window.addEventListener('message', (event) => {
      
      if (event.data && 
          event.data.embedded && 
          event.data.accessToken) {
        console.log('AuthCallback: Received valid SSO message:', event.data);
        this.handleSSOLogin(event.data);
      }
    });

    // Check URL params for embedded mode
    const urlParams = new URLSearchParams(window.location.search);
    const isEmbedded = urlParams.get('embedded') === 'true';

    if (isEmbedded) {
      // Check if we already have tokens in localStorage (for embedded mode)
      const existingToken = localStorage.getItem('auth_app_token');
      
      if (existingToken) {
        try {
          const tokenData = JSON.parse(existingToken);
          if (tokenData && tokenData.access_token) {
            
            // Create and set the token in Nebular Auth service
            this.setTokenInAuthService(tokenData);
            this.router.navigateByUrl('/pages');
            return;
          }
        } catch (e) {
          console.error('Error parsing existing token:', e);
        }
      }
      
      // If embedded but no token, wait for SSO message
      console.log('Embedded mode detected, waiting for SSO token...');
      return;
    }

    // Fallback to normal OAuth flow
    this.performNormalAuth();
  }

  private handleSSOLogin(ssoData: any) {
    // Create a token object compatible with Nebular Auth
    const tokenPayload = {
      access_token: ssoData.accessToken,
      refresh_token: ssoData.refreshToken,
      token_type: 'Bearer'
    };

    // Store the token in localStorage
    localStorage.setItem('auth_app_token', JSON.stringify(tokenPayload));

    // Set the token in Nebular Auth service
    this.setTokenInAuthService(tokenPayload);
    
    // Navigate to main pages
    this.router.navigateByUrl('/pages');
  }


  private setTokenInAuthService(tokenData: any) {
    // Create a Nebular Auth token
    const token = new NbAuthOAuth2JWTToken(tokenData, this.config.config["authProfile"], new Date());
    
    // Set the token in the auth service
    this.authService.onTokenChange().subscribe(); // Initialize the token stream
    this.authService['tokenStorage'].set(token).subscribe(() => {
      console.log('Token set in Nebular Auth service');
    });
  }

  private performNormalAuth() {
    this.authService.authenticate(this.config.config["authProfile"])
      .pipe(takeUntil(this.destroy$))
      .subscribe((authResult: NbAuthResult) => {
        if (authResult.isSuccess()) {
          this.router.navigateByUrl('/pages');
        } else {
          this.router.navigateByUrl('');
        }
      }, (error) => {
        console.log(error);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
