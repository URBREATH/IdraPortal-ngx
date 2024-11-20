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

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  token;
  constructor(public auth: NbAuthService, private config:ConfigService<Record<string, any>>) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.indexOf('/assets/') > -1) {
      return next.handle(req);
    }

    if (req.url.indexOf('/oauth2/token') > -1 || req.url.indexOf('/openid-connect/token') > -1 || req.url.indexOf('/api/menu-blocks') > -1|| req.url.indexOf('/public/dashboards') > -1) {
      return next.handle(req);
    }



    if (req.url.indexOf('/api/v1/') > -1 || req.url.indexOf('/home') > -1 || req.url.indexOf('/login') > -1 || req.url.indexOf('/static') > -1)  {
      let crsftoken = localStorage.getItem('crsftoken');
      let headers = req.headers;
      headers = headers.set("X-CSRF-TOKEN", crsftoken || "");
      req = req.clone({ headers : headers });
      return next.handle(req);
    }

    if (req.url.indexOf('/protocol/openid-connect/userinfo') > -1)
      return next.handle(req);
    
    let newHeaders = req.headers;


      return this.auth.isAuthenticatedOrRefresh().pipe(
        tap(authenticated=>{
          // console.log("tap authenticated => "+authenticated);
        }),

        switchMap((authenticated)=>{
          this.auth.getToken().subscribe((x: NbAuthOAuth2JWTToken) => this.token = x);
          let newHeaders = req.headers;
          console.log(this.token.getPayload());
          if (this.token.getPayload() != null) {
            newHeaders = newHeaders.append('Authorization', this.token.getPayload().access_token);
            localStorage.setItem('token', this.token.getPayload().access_token); 
          }
          const authReq = req.clone({ headers: newHeaders });
          
          return next.handle(authReq);
        })
      )
    

  }
}
