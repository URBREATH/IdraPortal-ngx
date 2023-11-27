import { Component, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { ConfigService } from '@ngx-config/core';
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

  private dataletBaseUrl:string;

  iframeUrl:string;

  constructor(
    protected dialogRef: NbDialogRef<DataletIframeComponent>,
    private configService: ConfigService
    ) {
      this.dataletBaseUrl = configService.getSettings("datalet_base_url");
     }

  ngOnInit(): void {
    this.iframeUrl=`${this.dataletBaseUrl}?ln=en&format=${this.format}&nodeID=${this.nodeID}&distributionID=${this.distributionID}&datasetID=${this.datasetID}&url=${encodeURIComponent(this.url)}`
  }

  close() {
    this.dialogRef.close();
  }

}
