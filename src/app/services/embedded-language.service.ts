import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from '../pages/services/shared.service';

@Injectable({
  providedIn: 'root'
})
export class EmbeddedLanguageService {

  constructor(
    
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
    this.initializeLanguageListener();
  }

  private initializeLanguageListener() {
    // Listen for language change messages from parent window
    window.addEventListener('message', (event) => {
      console.log('Received message:', event);
      if (event.data && event.data.language) {
        this.translate.use(event.data.language);
        this.sharedService.propagateDialogSelectedLanguage(event.data.language);
      }
    });
  }

  public getCurrentLanguage(): string {
    return localStorage.getItem('sso_language') || 'en';
  }
}