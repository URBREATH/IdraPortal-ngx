import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { NbMediaBreakpointsService, NbMenuItem, NbMenuService, NbSidebarService, NbThemeService, NB_WINDOW } from '@nebular/theme';

import { LayoutService } from '../../../@core/utils';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';
import { RippleService } from '../../../@core/utils/ripple.service';
import { Router } from '@angular/router';
import { ConfigService } from 'ngx-config-json';
import { NbAuthJWTToken, NbAuthService } from '../auth/public_api';

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {

  private destroy$: Subject<void> = new Subject<void>();
  public readonly materialTheme$: Observable<boolean>;
  userPictureOnly: boolean = false;
  // user: UserClaims;

  currentTheme = 'default';

  authenticationEnabled:boolean=false;

  userMenu: NbMenuItem[] = [];

  public constructor(
    private router: Router,
    private sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    // private userService: OidcUserInformationService,
    private layoutService: LayoutService,
    private breakpointService: NbMediaBreakpointsService,
    private rippleService: RippleService,
    private configService: ConfigService<Record<string, any>>,
    @Inject(NB_WINDOW) private window,
    private authService: NbAuthService
  ) {
    this.materialTheme$ = this.themeService.onThemeChange()
      .pipe(map(theme => {
        const themeName: string = theme?.name || '';
        return themeName.startsWith('material');
      }));

      this.authService.onTokenChange()
      .subscribe((token: NbAuthJWTToken) => {
      
        if (token.isValid()) {
          this.authenticated = true;
        } else {
          this.authenticated = false;
        }
        
      });
  }

  user: any = {};
  authenticated: boolean = false;

  ngOnInit() {

    this.userMenu = [
      { title: 'Keycloak Profile', url: `${this.configService['idmBaseURL']}/auth/realms/${this.configService['idmRealmName']}/account`,target:'_blank' }, 
      { title: 'Log out', data: { tag: "logout" } }
    ]

    this.currentTheme = this.themeService.currentTheme;
    this.authenticationEnabled=this.configService["enableAuthentication"]

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
    this.router.navigate(['/pages/home']);
    return false;
  }

  logIn() {
    this.router.navigate(['/pages/auth/login']);
  }

  logOut() {
    this.router.navigate(['/pages/auth/logout']);
  }
}
