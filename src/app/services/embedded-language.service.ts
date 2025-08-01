import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from '../pages/services/shared.service';

@Injectable({
  providedIn: 'root'
})
export class EmbeddedLanguageService {

  constructor(
    private translateService: TranslateService,
    private sharedService: SharedService
  ) {
    this.initializeLanguageListener();
  }

  private initializeLanguageListener() {
    // Listen for language change messages from parent window
    window.addEventListener('message', (event) => {
      // Validate origin if needed
      if (event.origin !== 'http://127.0.0.1:5500') {
        return;
      }

      // Handle both SSO messages and language-only messages
      if (event.data && event.data.language) {
        if (event.data.type === 'SSO_MESSAGE' || event.data.type === 'LANGUAGE_CHANGE') {
          console.log('EmbeddedLanguageService: Received language change:', event.data.language);
          this.setLanguage(event.data.language);
        }
      }
    });

    // Also listen for custom language change events
    window.addEventListener('sso-language-change', (event: any) => {
      console.log('EmbeddedLanguageService: Received sso-language-change event:', event.detail);
      if (event.detail && event.detail.language) {
        this.setLanguage(event.detail.language);
      }
    });

    console.log('EmbeddedLanguageService: Language listener initialized');
  }

  private setLanguage(language: string) {
    console.log(`EmbeddedLanguageService: Setting language to: ${language}`);
    
    // Store language
    localStorage.setItem('sso_language', language);
    
    // Set the language in translate service
    this.translateService.use(language);
    
    // Propagate through shared service
    if (this.sharedService && this.sharedService.propagateDialogSelectedLanguage) {
      this.sharedService.propagateDialogSelectedLanguage(language);
    }

    // Dispatch custom event for other components
    const customEvent = new CustomEvent('embedded-language-changed', { 
      detail: { language: language },
      bubbles: true
    });
    window.dispatchEvent(customEvent);
  }

  public getCurrentLanguage(): string {
    return localStorage.getItem('sso_language') || 'en';
  }
}