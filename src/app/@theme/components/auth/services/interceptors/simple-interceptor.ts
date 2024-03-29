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

@Injectable()
export class NbAuthSimpleInterceptor implements HttpInterceptor {

  constructor(protected tokenService: NbTokenService,
    @Inject(NB_AUTH_OPTIONS) protected options = {},private injector: Injector,
              @Inject(NB_AUTH_INTERCEPTOR_HEADER) protected headerName: string = 'Authorization',
              private router: Router,) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token_ = localStorage.getItem('token');
    const username = localStorage.getItem('username');


    return this.authService.getToken()
      .pipe(
        switchMap((token: NbAuthJWTToken): Observable<HttpEvent<any>> => { // Specify the return type as Observable<HttpEvent<any>>
          if (token_ != null) {
            req = req.clone({
              withCredentials: false,
              headers: new HttpHeaders({
                // 'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${token_}`,
                'Cookie': 'loggedin='+token+';username='+username,
                'observe': 'response',
              }),
            });
          }
          // check the response, if the response code is 401, remove the token and redirect to login page
          return next.handle(req)
          .pipe(
            catchError(err => {
              if (err instanceof HttpErrorResponse) {
      
                if (err.status === 401) {
                  localStorage.removeItem('token');
                  localStorage.removeItem('username');
                  this.tokenService.clear();
                  this.router.navigate(['/pages/auth/login']);
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
