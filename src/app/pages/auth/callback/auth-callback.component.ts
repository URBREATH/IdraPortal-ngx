import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { NbAuthService, NbAuthResult } from '@nebular/auth';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { ConfigService } from 'ngx-config-json';
import { TranslateService } from '@ngx-translate/core';


@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'nb-playground-oauth2-callback',
  template: ``,
})
export class AuthCallbackComponent implements OnDestroy {

  private destroy$ = new Subject<void>();

  constructor(private authService: NbAuthService, private router: Router, private config:ConfigService<Record<string, any>>,public translateService: TranslateService) {
    this.authService.authenticate(this.config.config["authProfile"])
      .pipe(takeUntil(this.destroy$))
      .subscribe((authResult: NbAuthResult) => {
        if (authResult.isSuccess()) {
          this.router.navigateByUrl('/pages');
          this.translateService.use('en');
        } else {
          this.router.navigateByUrl('');
        }
        
      }, (error) => {
        console.log(error)
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
