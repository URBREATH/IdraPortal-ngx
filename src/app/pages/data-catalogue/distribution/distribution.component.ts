import { Component, Input, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { DCATDistribution } from '../model/dcatdistribution';
import { DCTStandard } from '../model/dctstandard';
import { SKOSConcept } from '../model/skosconcept';

@Component({
  selector: 'ngx-distribution',
  templateUrl: './distribution.component.html',
  styleUrls: ['./distribution.component.scss']
})
export class DistributionComponent implements OnInit {

  @Input() distribution: DCATDistribution;
  @Input() datasetType: string = ''; // New input parameter for dataset type

  // Helper property to determine if the dataset is a special type (datasource, model/tool, ngsi)
  get isSpecialDatasetType(): boolean {
    if (!this.datasetType) return false;
    
    const type = this.datasetType.toLowerCase().replace(/\s/g, '');
    return type === 'datasources' || 
           type === 'modelsandtools' || 
           type === 'datasets'; // 'datasets' here refers to NGSI datasets
  }

  constructor(protected dialogRef: NbDialogRef<DistributionComponent>) { }

  ngOnInit(): void {
  }

  close() {
    this.dialogRef.close();
  }

  showDate(date){
		if(date=='1970-01-01T00:00:00Z') return false;
		return true;
	}

  printStandard(arr:DCTStandard[]){
    return arr.filter(x=> x.title!='' && x.title!=undefined).map(x=>x.title).join(',');
  }

  printConcepts(v: SKOSConcept){
    let ar=[];
    v.prefLabel.map( y =>{ if(y.value!='') ar.push(y.value) } );
    return ar.join(',')
  }
}
