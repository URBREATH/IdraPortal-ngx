import { Component, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { ConfigService } from 'ngx-config-json';
import { DCATDistribution } from '../model/dcatdistribution';

@Component({
  selector: 'ngx-datalet-iframe',
  templateUrl: './datalet-iframe.component.html',
  styleUrls: ['./datalet-iframe.component.scss']
})
export class DataletIframeComponent implements OnInit {

  datasetID:string;
  format:string;
  nodeID:string;
  distributionID:string;
  url:string;
  loading: boolean = true;

  private dataletBaseUrl:string;

  iframeUrl:string;

  constructor(
    protected dialogRef: NbDialogRef<DataletIframeComponent>,
    private configService: ConfigService<Record<string, any>>
    ) {
      this.dataletBaseUrl = this.configService.config["datalet_base_url"];
      console.log(this.dataletBaseUrl);
     }

  ngOnInit(): void {
    this.iframeUrl=`${this.dataletBaseUrl}?ln=en&format=${this.format}&nodeID=${this.nodeID}&distributionID=${this.distributionID}&datasetID=${this.datasetID}&url=${encodeURIComponent(this.url)}`
    // check when the iframe is loaded
    let iframe = document.getElementById('iframe') as HTMLIFrameElement;
    iframe.onload = (event: Event) => {
      this.loading = false;
    }
    iframe.onerror = (event: Event) => {
      this.loading = false;
    }
  }

  close() {
    this.dialogRef.close();
  }

}
