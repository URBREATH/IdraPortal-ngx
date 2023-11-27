import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { NbAuthService, NbAuthResult } from '@nebular/auth';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { ConfigService } from '@ngx-config/core';

@Component({
  selector: 'nb-playground-oauth2-callback',
  template: ``,
})
export class AuthCallbackComponent implements OnDestroy {

  private destroy$ = new Subject<void>();

  constructor(private authService: NbAuthService, private router: Router, private configService: ConfigService) {
    this.authService.authenticate(this.configService.getSettings("authProfile"))
      .pipe(takeUntil(this.destroy$))
      .subscribe((authResult: NbAuthResult) => {
        if (authResult.isSuccess()) {
          this.router.navigateByUrl('/pages/home')
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