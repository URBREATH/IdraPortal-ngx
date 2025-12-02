import { Component, Input } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
  selector: 'ngx-remoteCatalogue-dialog',
  templateUrl: 'preview-dialog.component.html',
  styleUrls: ['preview-dialog.component.scss'],
})
export class PreviewDialogComponent {

  @Input() title: string;
  url: string;
  loading: boolean;
  text: string;
  youtubeUrl: string;
  isEndpoint: boolean = false;
  endpointUrl: string;

  constructor(protected ref: NbDialogRef<PreviewDialogComponent>) {}

  ngOnInit() {
    // --- CASE 1: Endpoint
    if (this.isEndpoint && this.endpointUrl) {
      this.loading = false;
      return;
    }

    // --- CASE 2: YouTube video
    if (this.youtubeUrl) {
      this.loading = true;
      const iframe = document.createElement('iframe');
      iframe.setAttribute('width', '560');
      iframe.setAttribute('height', '315');
      iframe.setAttribute('style', 'height: 70vh; width: 80vw; border: none;');
      iframe.setAttribute('title', 'YouTube video player');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'encrypted-media; picture-in-picture');
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.src = this.youtubeUrl;

      iframe.onload = () => this.loading = false;
      iframe.onerror = () => this.loading = false;

      document.getElementById('iframeBody')?.appendChild(iframe);
      return;
    }

    // --- CASE 3: Show Google Doc (when text is undefined)
    if (this.text === undefined) {
      this.loading = true;
      const src = 'https://docs.google.com/gview?url=' + this.url + '&embedded=true';

      const iframe = document.createElement('iframe');
      iframe.setAttribute('style', 'height: 70vh;width: 80vw;');
      iframe.src = src;

      const interval = setInterval(() => {
        this.loading = true;
        iframe.src = src;
      }, 5000);

      iframe.onload = () => {
        this.loading = false;
        clearInterval(interval);
      };

      iframe.onerror = () => {
        this.loading = false;
      };

      document.getElementById('iframeBody')?.appendChild(iframe);
      return;
    }

    // --- CASE 4: Show raw text (JSON pretty-print if possible)
    this.loading = true;
    const pre = document.createElement('pre');
    pre.setAttribute('style', 'height: 70vh;width: 80vw;overflow: auto;');
    pre.setAttribute('readonly', 'true');

    try {
      const parsed = JSON.parse(this.text);
      pre.textContent = JSON.stringify(parsed, null, 2);
    } catch (e) {
      pre.textContent = this.text;
    }

    document.getElementById('iframeBody')?.appendChild(pre);

    this.loading = false;
  }

  // --- FIX: method must be OUTSIDE ngOnInit()
  openEndpointInNewWindow() {
    if (this.endpointUrl) {
      window.open(this.endpointUrl, '_blank');
    }
  }
}


