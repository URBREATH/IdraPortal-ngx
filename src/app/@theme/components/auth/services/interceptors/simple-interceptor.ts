import { Inject, Injectable, Injector } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpEventType, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { NbAuthService } from '../auth.service';
import { NB_AUTH_INTERCEPTOR_HEADER, NB_AUTH_OPTIONS } from '../../auth.options';
import { NbAuthJWTToken } from '../token/token';
import { NbTokenService } from '../token/token.service';
import { NbAuthResult } from '../auth-result';
import { Router } from '@angular/router';
import { MENU_ITEMS } from '../../../../../pages/pages-menu';
import { ConfigService } from 'ngx-config-json';

@Injectable()
export class NbAuthSimpleInterceptor implements HttpInterceptor {
  menu: any;

  constructor(protected tokenService: NbTokenService,private config: ConfigService<Record<string, any>>,
    @Inject(NB_AUTH_OPTIONS) protected options = {}, private injector: Injector,
    @Inject(NB_AUTH_INTERCEPTOR_HEADER) protected headerName: string = 'Authorization',
    private router: Router) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Check for tokens in different sources with priority order
    const token_ = localStorage.getItem('token');
    const ssoToken = localStorage.getItem('serviceToken');
    
    // Use SSO token if available, otherwise fall back to regular token
    const effectiveToken = ssoToken || token_;

    this.menu = MENU_ITEMS;

    if (req.url.includes('/IdraPortal-ngx-Translations')) {
      const clonedReq = req.clone({
        headers: req.headers.delete('Authorization')
      });
      //console.log('Request to IdraPortal-ngx-Translations, removing Authorization header.');
      return next.handle(clonedReq);
    }

    return this.authService.getToken()
      .pipe(
        switchMap((token: NbAuthJWTToken): Observable<HttpEvent<any>> => {
          if (effectiveToken != null) {
            req = req.clone({
              withCredentials: false,
              headers: new HttpHeaders({
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${effectiveToken}`,
               // 'Cookie': 'loggedin=' + token + ';username=' + username,
                'observe': 'response',
              }),
            });
            this.menu.map(item => {
              if (item.hidden) {
                this.authService.isAuthenticated().subscribe(auth => {
                  item.hidden = !auth;
                });
              }
            });
          }
          return next.handle(req)
            .pipe(
              catchError(err => {
                if (err instanceof HttpErrorResponse) {
                  if (err.status === 401) {
                    console.log('🔥 401 error detected in interceptor');
                    
                    // Check if user has any kind of SSO tokens (skip clearing for SSO users)
                    const ssoToken = localStorage.getItem('serviceToken');
                    const authAppToken = localStorage.getItem('auth_app_token');
                    const refreshToken = localStorage.getItem('refreshToken');
                    
                    if (ssoToken || authAppToken || refreshToken) {
                      console.log('🔒 SSO user detected, preserving tokens');
                      
                      // Try to use serviceToken if it exists but wasn't used
                      if (ssoToken && !req.headers.has('Authorization')) {
                        console.log('🔄 Retrying with SSO token');
                        const authReq = req.clone({
                          headers: req.headers.set('Authorization', `Bearer ${ssoToken}`)
                        });
                        return next.handle(authReq);
                      }
                      
                      return throwError(err); // Don't clear tokens for SSO users
                    }
                    
                    // Only clear tokens for non-SSO users
                    console.log('🗑️ Clearing tokens for non-SSO user');
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                    this.tokenService.clear();
                    this.router.navigate(['/pages/auth/login'], 
                      {
                        queryParamsHandling: 'merge',
                      }
                  );
                  }
                  return throwError(err);
                }
              }),
            );
        }),
      );
  }

  protected get authService(): NbAuthService {
    return this.injector.get(NbAuthService);
  }
}