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
    const token_ = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    this.menu = MENU_ITEMS;

    if (req.url.includes('/IdraPortal-ngx-Translations')) {
      const clonedReq = req.clone({
        headers: req.headers.delete('Authorization')
      });
      console.log('Request to IdraPortal-ngx-Translations, removing Authorization header.');
      return next.handle(clonedReq);
    }

    return this.authService.getToken()
      .pipe(
        switchMap((token: NbAuthJWTToken): Observable<HttpEvent<any>> => {
          if (token_ != null) {
            req = req.clone({
              withCredentials: false,
              headers: new HttpHeaders({
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${token_}`,
                'Cookie': 'loggedin=' + token + ';username=' + username,
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