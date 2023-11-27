import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NbAuthResult, NbAuthService, NbAuthOAuth2Token, NbAuthOAuth2JWTToken } from '@nebular/auth';
import { ConfigService } from '@ngx-config/core';


@Component({
  selector: 'nb-oauth2-login',
  template: ``,
})
export class AuthLoginComponent implements OnDestroy {
  token: NbAuthOAuth2JWTToken;
  private destroy$ = new Subject<void>();

  constructor(private authService: NbAuthService, private configService: ConfigService) {
    this.login();
    this.authService.onTokenChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe((token: NbAuthOAuth2JWTToken) => {
        this.token = null;
        if (token && token.isValid()) {
          this.token = token;
        }
      });
  }

  login() {
    this.authService.authenticate(this.configService.getSettings("authProfile"))
      .pipe(takeUntil(this.destroy$))
      .subscribe((authResult: NbAuthResult) => {
        console.log(authResult)
      });
  }

  logout() {
    this.authService.logout(this.configService.getSettings("authProfile"))
      .pipe(takeUntil(this.destroy$))
      .subscribe((authResult: NbAuthResult) => {
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}