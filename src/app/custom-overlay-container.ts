import { Injectable, Inject } from '@angular/core';
import { NbOverlayContainerAdapter, NB_DOCUMENT, NB_WINDOW } from '@nebular/theme';

@Injectable()
export class CustomOverlayContainerAdapter extends NbOverlayContainerAdapter {
  private _container: HTMLElement;
  private _observer: MutationObserver;

  constructor(
    @Inject(NB_DOCUMENT) document: any,
    @Inject(NB_WINDOW) window: any
  ) {
    super(document, window);
    this.createContainer();
    this.setupMutationObserver();
  }

  // Override the check container method to prevent layout errors
  checkContainer(): void {
    // Skip the check for nb-layout
    return;
  }

  // Create a container in the body
  protected createContainer(): void {
    this._container = document.createElement('div');
    this._container.classList.add('nb-global-overlay-container');
    
    // Make the container not block clicks on elements underneath
    this._container.style.pointerEvents = 'none';
    
    // Position it absolutely to cover the entire viewport
    this._container.style.position = 'fixed';
    this._container.style.top = '0';
    this._container.style.left = '0';
    this._container.style.width = '100vw';
    this._container.style.height = '100vh';
    this._container.style.zIndex = '1000';
    this._container.style.overflow = 'visible';
    
    document.body.appendChild(this._container);
  }

  // Override get container to return our custom container
  getContainerElement(): HTMLElement {
    return this._container;
  }

  // Override clear container method to handle our custom container
  clearContainer(): void {
    if (this._container) {
      // Remove all children
      while (this._container.firstChild) {
        this._container.removeChild(this._container.firstChild);
      }
    }
  }
  
  // Setup a mutation observer to handle pointer events for children
  private setupMutationObserver(): void {
    if (this._container && window.MutationObserver) {
      this._observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // For each added node, enable pointer events
            mutation.addedNodes.forEach((node: Node) => {
              if (node instanceof HTMLElement) {
                // Make sure this element and all its children capture pointer events
                node.style.pointerEvents = 'auto';
                
                // For any dialog backdrops, make sure they're clickable
                const backdrops = node.querySelectorAll('.overlay-backdrop');
                backdrops.forEach(backdrop => {
                  if (backdrop instanceof HTMLElement) {
                    backdrop.style.pointerEvents = 'auto';
                  }
                });
              }
            });
          }
        });
      });
      
      // Start observing the container for child additions with subtree
      this._observer.observe(this._container, { 
        childList: true,
        subtree: true
      });
    }
  }
}
