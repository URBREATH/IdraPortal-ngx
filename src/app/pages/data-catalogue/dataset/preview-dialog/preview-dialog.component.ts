import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { NbDialogRef } from '@nebular/theme';

@Component({
  selector: 'ngx-remoteCatalogue-dialog',
  templateUrl: 'preview-dialog.component.html',
  styleUrls: ['preview-dialog.component.scss'],
})
export class PreviewDialogComponent {

  @Input() title: string;
  url: string;
  iFrameUrl: SafeUrl;
  loading: boolean;

  constructor(protected ref: NbDialogRef<PreviewDialogComponent>, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.loading = true;
    let url = 'https://docs.google.com/gview?url='+this.url+'&embedded=true';
    this.iFrameUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    let iframe = document.createElement('iframe');
    iframe.setAttribute('style','height: 70vh;width: 80vw;');
    iframe.src = url;
    let interval = setInterval(() => {
      this.loading = true;
      iframe.src = url;
    }, 5000);
    iframe.onload = (event: Event) => {
      this.loading = false;
      clearInterval(interval);
    };
    iframe.onerror = (event: Event) => {
      this.loading = false;
    };
    document.getElementById('iframeBody').appendChild(iframe);
  }
}
