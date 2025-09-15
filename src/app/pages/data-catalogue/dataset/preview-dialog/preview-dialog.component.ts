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
    if (this.isEndpoint && this.endpointUrl) {
      // Handle endpoint - nothing to do here, template will handle it
      this.loading = false;
    }
    else if (this.youtubeUrl) {
      // Handle YouTube embed
      this.loading = true;
      let iframe = document.createElement('iframe');
      iframe.setAttribute('width', '560');
      iframe.setAttribute('height', '315');
      iframe.setAttribute('style', 'height: 70vh; width: 80vw; border: none;');
      iframe.setAttribute('title', 'YouTube video player');
      iframe.setAttribute('frameborder', '0');
      // Use a limited set of permissions to reduce tracking-related errors
      iframe.setAttribute('allow', 'encrypted-media; picture-in-picture');
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.src = this.youtubeUrl;
      
      iframe.onload = (event: Event) => {
        this.loading = false;
      };
      
      iframe.onerror = (event: Event) => {
        this.loading = false;
      };
      
      document.getElementById('iframeBody').appendChild(iframe);
    } 
    else if(this.text == undefined){
      this.loading = true;
      let url = 'https://docs.google.com/gview?url='+this.url+'&embedded=true';
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
    } else{
      this.loading = true;
      let pre = document.createElement('pre');
      pre.setAttribute('style','height: 70vh;width: 80vw;overflow: auto;');
      pre.setAttribute('readonly','true');
      pre.setAttribute('lang','xml')
      pre.textContent = this.text;
      document.getElementById('iframeBody').appendChild(pre);
      this.loading = false;
    }
  }

  openEndpointInNewWindow() {
    if (this.endpointUrl) {
      window.open(this.endpointUrl, '_blank');
    }
  }
}
