import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { NbMediaBreakpointsService, NbMenuItem, NbMenuService, NbSidebarService, NbThemeService, NB_WINDOW } from '@nebular/theme';

import { LayoutService } from '../../../@core/utils';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';
import { RippleService } from '../../../@core/utils/ripple.service';
import { KeyrockUserInformationService } from '../../../auth/services/keyrock-user-information.service';
import { IDMUser } from '../../../auth/oauth/model/idmuser';
import { NbAuthService } from '@nebular/auth';
import { Router } from '@angular/router';
import { OidcUserInformationService } from '../../../auth/services/oidc-user-information.service';
import { UserClaims } from '../../../auth/oidc/oidc';
import { ConfigService } from '@ngx-config/core';

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {

  private destroy$: Subject<void> = new Subject<void>();
  public readonly materialTheme$: Observable<boolean>;
  userPictureOnly: boolean = false;
  user: UserClaims;

  currentTheme = 'default';

  authenticationEnabled:boolean=false;

  userMenu: NbMenuItem[] = [];

  public constructor(
    private router: Router,
    private sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    private userService: OidcUserInformationService,
    private layoutService: LayoutService,
    private breakpointService: NbMediaBreakpointsService,
    private rippleService: RippleService,
    private configService: ConfigService,
    @Inject(NB_WINDOW) private window
  ) {
    this.materialTheme$ = this.themeService.onThemeChange()
      .pipe(map(theme => {
        const themeName: string = theme?.name || '';
        return themeName.startsWith('material');
      }));
  }

  ngOnInit() {


    this.userMenu = [
      { title: 'Keycloak Profile', url: `${this.configService.getSettings('idmBaseURL')}/auth/realms/${this.configService.getSettings('idmRealmName')}/account`,target:'_blank' }, 
      { title: 'Log out', data: { tag: "logout" } }
    ]

    this.currentTheme = this.themeService.currentTheme;
    this.authenticationEnabled=this.configService.getSettings("enableAuthentication")
    this.userService.onUserChange()
      .subscribe((user: any) => {this.user = user; console.log(this.user)});
    // this.userService.getUser()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe((user: UserClaims) => this.user = user, error => console.log(error));

    const { xl } = this.breakpointService.getBreakpointsMap();
    this.themeService.onMediaQueryChange()
      .pipe(
        map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
        takeUntil(this.destroy$),
      )
      .subscribe((isLessThanXl: boolean) => this.userPictureOnly = isLessThanXl);

    this.themeService.onThemeChange()
      .pipe(
        map(({ name }) => name),
        takeUntil(this.destroy$),
      )
      .subscribe(themeName => {
        this.currentTheme = themeName;
        this.rippleService.toggle(themeName?.startsWith('material'));
      });

    this.menuService.onItemClick()
      .pipe(
        filter(({ tag }) => tag === 'user-menu'),
        map(({ item: { data } }) => data),
      )
      .subscribe(res => {
        if (res["tag"] == "logout") {
          // window.open(this.userService.getLogoutUrl(), '_self');
          this.router.navigate(['/auth/logout']);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeTheme(themeName: string) {
    this.themeService.changeTheme(themeName);
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');
    this.layoutService.changeLayoutSize();

    return false;
  }

  navigateHome() {
    this.menuService.navigateHome();
    return false;
  }
}
