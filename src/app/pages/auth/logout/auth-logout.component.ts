import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NbAuthOAuth2JWTToken, NbAuthResult, NbAuthService, NbTokenService } from '@nebular/auth';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NB_WINDOW } from '@nebular/theme';
import { ConfigService } from 'ngx-config-json';
import { environment } from '../../../../environments/environment';


@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'nb-oauth2-logout',
  template: ``
})
export class AuthLogoutComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  constructor(private authService: NbAuthService,
    private tokenService: NbTokenService,
    private router: Router,
    private config:ConfigService<Record<string, any>>,
    private http: HttpClient,
    @Inject(NB_WINDOW) private window) {
  }


  async ngOnInit(): Promise<void> {

    try {
      let token = await this.authService.getToken().toPromise() as NbAuthOAuth2JWTToken;

      this.authService.logout(this.config.config["authProfile"])
        .pipe(takeUntil(this.destroy$))
        .subscribe((authResult: NbAuthResult) => {
          if (authResult.isSuccess()) {
            this.window.location.href =
              `${this.config.config["keyCloakBaseURL"]}/auth/realms/${this.config.config["keyCloakRealmName"]}/protocol/openid-connect/logout?post_logout_redirect_uri=${this.config.config['dashboardBaseURL']}/pages&client_id=${environment.client_id}`
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
