import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // Add this import
// import { NbAccessChecker } from '@nebular/security';
import { NbMenuItem } from '@nebular/theme';
import { ConfigService } from 'ngx-config-json';
import { Subscription } from 'rxjs';

import { MENU_ITEMS } from './pages-menu';
import { NbAccessChecker } from '@nebular/security';
import { NbAuthOAuth2JWTToken, NbAuthService } from '@nebular/auth';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from './menu-item';
import { SharedService } from './services/shared.service';

@Component({
  selector: 'ngx-pages',
  styleUrls: ['pages.component.scss'],
  template: `
    <ngx-one-column-layout *ngIf="!isEmbedded">
      <nb-menu [items]="menu"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
    <ngx-embedded-layout  *ngIf="isEmbedded">
      <router-outlet></router-outlet>
    </ngx-embedded-layout>
  `,
})
export class PagesComponent implements OnInit, OnDestroy {

  menu: MenuItem[];
  userRoles: string[];
  isEmbedded: boolean = false;
  private subscriptions: Subscription[] = [];
  
  constructor(
    private accessChecker: NbAccessChecker,
    private configService: ConfigService<Record<string, any>>,
    private auth: NbAuthService,
    private translateService: TranslateService,
    private sharedService: SharedService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    
    // Subscribe to embedded state from SharedService
    const embeddedSubscription = this.sharedService.embeddedState$.subscribe(isEmbedded => {
      this.isEmbedded = isEmbedded;
    });
    this.subscriptions.push(embeddedSubscription);

    // Also check embedded status from URL query parameter (fallback)
    this.route.queryParams.subscribe(params => {
      if (params['embedded'] === 'true' && !this.isEmbedded) {
        this.sharedService.updateEmbeddedState(true);
      }
    });

    this.menu = MENU_ITEMS;

    this.translateService.onLangChange.subscribe(event => this.translateMenuItems());
    this.translateMenuItems();
    this.translateService.use('en');
    
    if (this.configService.config['enableAuthentication']) {
      this.authMenuItems();
      
      // Subscribe to authentication state changes
      const authSubscription = this.auth.onAuthenticationChange()
        .subscribe(authenticated => {
          // Update menu items visibility when auth state changes
          this.authMenuItems();
        });
      this.subscriptions.push(authSubscription);
      
      // Also subscribe to token state from SharedService
      const tokenSubscription = this.sharedService.tokenReceived$
        .subscribe(hasToken => {
          this.authMenuItems();
        });
      this.subscriptions.push(tokenSubscription);
      
      // Listen for logout events
      window.addEventListener('idra-user-logout', () => {
        // Make sure admin menu is hidden after logout
        this.menu.forEach(item => {
          if (item.data && item.data['name'] === 'administration') {
            item.hidden = true;
          }
        });
      });
    }
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Remove event listener
    window.removeEventListener('idra-user-logout', this.handleLogout);
  }
  
  private handleLogout = () => {
    // Make sure admin menu is hidden after logout
    this.menu.forEach(item => {
      if (item.data && item.data['name'] === 'administration') {
        item.hidden = true;
      }
    });
  }

  authMenuItems() {
    this.menu.forEach(item => {
      if(item.data && item.data['name'] === 'administration')
        this.authMenuItem(item);
    });
  }

  authMenuItem(menuItem: MenuItem) {
  const storedLanguage = localStorage.getItem('sso_language') || 'en';
  this.translateService.use(storedLanguage);
  this.sharedService.propagateDialogSelectedLanguage(storedLanguage);
    
    // Check for token - either in SharedService or localStorage
    const hasToken = this.sharedService.getSSOToken() || localStorage.getItem('serviceToken');
    const hasAuthToken = localStorage.getItem('auth_app_token');
    
    if (!hasToken && !hasAuthToken) {
      // No authentication tokens, hide admin menu
      menuItem.hidden = true;
      return;
    }
    
    // Check access rights if token exists
    if (menuItem.data && menuItem.data['name']) {
      this.accessChecker.isGranted('view', menuItem.data['name']).subscribe(res => {
        menuItem.hidden = !res;
        
        // Also update children visibility
        if (!menuItem.hidden && menuItem.children != null) {
          menuItem.children.forEach(item => {
            item.hidden = menuItem.hidden;
          });
        }
      });
    } else {
      menuItem.hidden = true;
    }
  }
  translateMenuItems() {
    this.menu.forEach(item => this.translateMenuItem(item));
  }

  translateMenuItem(menuItem: MenuItem) {
    if (menuItem.children != null) {
      menuItem.children.forEach(item => this.translateMenuItem(item));
    }
    menuItem.title = this.translateService.instant(menuItem.key);
  }
}
