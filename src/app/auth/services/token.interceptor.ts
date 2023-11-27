import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { NbAuthOAuth2JWTToken, NbAuthOAuth2Token, NbAuthService } from '@nebular/auth';
import { ConfigService } from '@ngx-config/core';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  token;
  constructor(public auth: NbAuthService, public config:ConfigService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.indexOf('/assets/') > -1) {
      return next.handle(req);
    }

    if (req.url.indexOf('/oauth2/token') > -1 || req.url.indexOf('/openid-connect/token') > -1) {
      return next.handle(req);
    }

    if (req.url.indexOf(this.config.getSettings('idra_base_url')) > -1) {
      return next.handle(req);
    }

    
    let newHeaders = req.headers;
    
    if(this.config.getSettings('enableAuthentication')){
      this.auth.getToken().subscribe((x: NbAuthOAuth2JWTToken) => this.token = x);
      if (this.token.getPayload() != null) {
        newHeaders = newHeaders.append('Authorization', 'Bearer ' + this.token.getPayload().access_token);
      }
    }

    const authReq = req.clone({ headers: newHeaders });
    return next.handle(authReq);
  }
}
