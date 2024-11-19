import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NbAuthResult, NbAuthService, NbAuthOAuth2Token, NbAuthOAuth2JWTToken } from '@nebular/auth';
import { ConfigService } from 'ngx-config-json';



@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'nb-oauth2-login',
  template: ``,
})
export class AuthLoginComponent implements OnDestroy {
  token: NbAuthOAuth2JWTToken;
  private destroy$ = new Subject<void>();

  constructor(private authService: NbAuthService, private config:ConfigService<Record<string, any>>,) {
    console.log('qui prima del login');
    this.login();
    this.authService.onTokenChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe((token: NbAuthOAuth2JWTToken) => {
        this.token = null;
        if (token && token.isValid()) {
          this.token = token;
          console.log("updateUser");
        }
      });
  }

  login() {
    
    this.authService.authenticate(this.config.config["authProfile"])
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: data => {
        console.log(data);
        // Qui puoi aggiungere il codice per gestire i dati ricevuti
      },
      error: error => {
        console.error(error);
        // Qui puoi aggiungere il codice per gestire gli errori
      },
      complete: () => {
        // Questa funzione viene chiamata quando l'Observable è completato
      }
    });
  }

  logout() {
    this.authService.logout(this.config.config["authProfile"])
      .pipe(takeUntil(this.destroy$))
      .subscribe((authResult: NbAuthResult) => {
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
