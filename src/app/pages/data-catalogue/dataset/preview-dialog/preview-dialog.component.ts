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

  constructor(protected ref: NbDialogRef<PreviewDialogComponent>) {}

  ngOnInit() {
    if(this.text == undefined){
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
}
