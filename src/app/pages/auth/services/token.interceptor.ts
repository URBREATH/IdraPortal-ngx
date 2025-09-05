import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { NbAuthOAuth2JWTToken, NbAuthOAuth2Token, NbAuthService } from '@nebular/auth';
import { switchMap, tap } from 'rxjs/operators';
import { ConfigService } from 'ngx-config-json';
import { SharedService } from '../../services/shared.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(
    public auth: NbAuthService, 
    private config: ConfigService<Record<string, any>>,
    private sharedService: SharedService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.indexOf('/assets/') > -1) {
      return next.handle(req);
    }

    if (req.url.indexOf('/oauth2/token') > -1 
      || req.url.indexOf('/openid-connect/token') > -1 
      || req.url.indexOf('/api/menu-blocks') > -1
      || req.url.indexOf('/public/dashboards') > -1) {
      return next.handle(req);
    }
    
    return this.auth.isAuthenticatedOrRefresh().pipe(
      switchMap(authenticated => {
        // First check for SSO token
        const ssoToken = this.sharedService.getSSOToken();
        if (ssoToken && !req.url.includes('/IdraPortal-ngx-Translations')) {
          const newHeaders = req.headers.set('Authorization', `Bearer ${ssoToken}`);
          const authReq = req.clone({ headers: newHeaders });
          return next.handle(authReq);
        }

        // Fall back to Nebular auth token if no SSO token
        return this.auth.getToken().pipe(
          switchMap((x: NbAuthOAuth2JWTToken) => {
            const token = x.getPayload()?.access_token;
            let newHeaders = req.headers;
            
            if (token && !req.url.includes('/IdraPortal-ngx-Translations')) {
              newHeaders = newHeaders.set('Authorization', `Bearer ${token}`);
            }
            
            const authReq = req.clone({ headers: newHeaders });
            return next.handle(authReq);
          })
        );
      })
    );
  }
}