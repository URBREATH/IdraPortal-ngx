import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NbAuthOAuth2JWTToken, NbAuthResult, NbAuthService, NbTokenService } from '@nebular/auth';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfigService } from '@ngx-config/core';
import { HttpClient } from '@angular/common/http';
import { NB_WINDOW } from '@nebular/theme';


@Component({
  selector: 'ngx-nb-oauth2-logout',
  template: ``
})
export class AuthLogoutComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  constructor(private authService: NbAuthService,
    private tokenService: NbTokenService,
    private router: Router,
    private configService: ConfigService,
    private http: HttpClient,
    @Inject(NB_WINDOW) private window) {
  }


  async ngOnInit(): Promise<void> {

    try {
      let token = await this.authService.getToken().toPromise() as NbAuthOAuth2JWTToken;

      this.authService.logout(this.configService.getSettings("authProfile"))
        .pipe(takeUntil(this.destroy$))
        .subscribe((authResult: NbAuthResult) => {
          if (authResult.isSuccess()) {

            this.window.location.href =
              `${this.configService.getSettings("idmBaseURL")}/auth/realms/${this.configService.getSettings("idmRealmName")}/protocol/openid-connect/logout?redirect_uri=${this.configService.getSettings('dashboardBaseURL')}/auth`;

          } else {
            this.router.navigateByUrl('');
          }
        }, (error) => {
          console.log(error)
        });

    } catch (error) {
      console.log(error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
