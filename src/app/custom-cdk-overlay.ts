import { Injectable, Inject, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Platform } from '@angular/cdk/platform';

@Injectable()
export class CustomOverlayContainer extends OverlayContainer implements OnDestroy {
  constructor(
    @Inject(DOCUMENT) document: any,
    private platform: Platform
  ) {
    super(document, platform);
  }

  /**
   * Override _createContainer to use a different container class and
   * attach it directly to the body
   */
  protected override _createContainer(): void {
    const container = this._document.createElement('div');
    container.classList.add('cdk-overlay-container', 'custom-overlay-container');
    
    // Ensure this container doesn't block underlying UI
    container.style.pointerEvents = 'none';
    
    this._document.body.appendChild(container);
    this._containerElement = container;
  }

  ngOnDestroy() {
    if (this._containerElement) {
      this._containerElement.remove();
    }
    this._containerElement = null;
  }
}
