import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { NbMediaBreakpointsService, NbMenuService, NbSidebarService, NbThemeService, NbMenuItem, NB_WINDOW } from '@nebular/theme';


import { LayoutService } from '../../../@core/utils';
import {filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { UserClaims } from '../../../pages/auth/oidc/oidc';
import { Router } from '@angular/router';
import { OidcUserInformationService } from '../../../pages/auth/services/oidc-user-information.service';
import { ConfigService } from 'ngx-config-json';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { NbAuthJWTToken, NbAuthService } from '../auth/public_api';
import { RippleService } from '../../../@core/utils/ripple.service';
import { Observable } from 'rxjs';
import { SharedService } from '../../../pages/services/shared.service';



@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {

  private destroy$: Subject<void> = new Subject<void>();
  userPictureOnly: boolean = false;
  user: UserClaims;
  userMenuDefault: NbMenuItem[] = [];
  authenticationEnabled:boolean=false;
  currentTheme = 'default';
  typeLogin = "";
  userMenu: NbMenuItem[] = [];
  public idraUserLanguage: string;
  public readonly materialTheme$: Observable<boolean>;
  public languages = [];

  constructor(private sidebarService: NbSidebarService,
              private menuService: NbMenuService,
              private themeService: NbThemeService,
              private userService: OidcUserInformationService,
              private layoutService: LayoutService,
              private rippleService: RippleService,
              private configService: ConfigService<Record<string, any>>,
              @Inject(NB_WINDOW) private window,
              private breakpointService: NbMediaBreakpointsService,
              private router: Router,
              private authService: NbAuthService,
              private translate: TranslateService,
              private sharedService: SharedService,
              ) {
                this.typeLogin = this.configService.config["authenticationMethod"];
       if(this.typeLogin.toLowerCase() === "basic"){         
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
            
  }


  authenticated: boolean = false;
  
  ngOnInit() {
    this.idraUserLanguage = 'en';

    let lan = this.configService.config['languages'];

    lan.forEach(x => {
      let f = x;
      if (x == 'en') f = 'gb'
      if (x == 'sp') f = 'es'
      //this.languages.push({lan:x,flag: `flag-icon flag-icon-${f} flag-icon-squared` })
      this.languages.push({ lan: x, flag: f, picture: `assets/flags/${f}.svg` })
    })
    this.translate.use(this.idraUserLanguage);
    this.sharedService.propagateDialogSelectedLanguage(this.idraUserLanguage);

    if(this.typeLogin.toLowerCase() === "keycloak"){
    this.currentTheme = this.themeService.currentTheme;
    console.log(this.user);
    this.authenticationEnabled=this.configService.config["enableAuthentication"];
       this.userMenuDefault = [
      {
        title: "Login",
        data: { tag: "login" },
       url: `${this.configService.config['dashboardBaseURL']}/keycloak-auth/`
      },
    ];
    this.userMenu = [
      { title: 'Profile', url: `${this.configService.config['keyCloakBaseURL']}/auth/realms/${this.configService.config['keyCloakRealmName']}/account`,target:'_blank' },
      { title: 'Log out', data: { tag: "logout" }, url:`${this.configService.config['dashboardBaseURL']}/keycloak-auth/logout` }
    ]

    this.userService.onUserChange()
    .subscribe((user: any) => {this.user = user; console.log(this.user);  console.log("updateUser");
    });

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
      .subscribe(themeName => this.currentTheme = themeName);
      this.menuService.onItemClick()
      .pipe(
        filter(({ tag }) => tag === 'user-menu'),
        map(({ item: { data } }) => data),
      )
      .subscribe(res => {
        if (res["tag"] == "logout") {
          this.router.navigate([`${this.configService.config['dashboardBaseURL']}/keycloak-auth/logout`], 
                      {
                        queryParamsHandling: 'merge',
                      });
        }
      });
    }else{
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
            this.router.navigate(['/auth/logout'], 
                      {
                        queryParamsHandling: 'merge',
                      });
          }
        });
    }
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
    this.router.navigate(['/pages/home'], 
    {
      queryParamsHandling: 'merge',
    });
    return false;
  }

  logIn() {
    this.router.navigate(['/pages/auth/login'], 
    {
      queryParamsHandling: 'merge',
    });
  }

  logOut() {
    this.router.navigate(['/pages/auth/logout'], 
    {
      queryParamsHandling: 'merge',
    });
  }
  changeLang(event) {
    this.translate.use(event);
    this.sharedService.propagateDialogSelectedLanguage(event);
  }
}
