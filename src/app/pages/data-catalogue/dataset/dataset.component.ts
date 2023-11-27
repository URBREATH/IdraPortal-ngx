import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { ConfigService } from '@ngx-config/core';
import { DataletIframeComponent } from '../datalet-iframe/datalet-iframe.component';
import { DistributionComponent } from '../distribution/distribution.component';
import { DCATDataset } from '../model/dcatdataset';
import { DCATDistribution } from '../model/dcatdistribution';
import { SKOSConcept } from '../model/skosconcept';
import { DataCataglogueAPIService } from '../services/data-cataglogue-api.service';
import { ShowDataletsComponent } from '../show-datalets/show-datalets.component';
import * as URLParse from 'url-parse';

@Component({
  selector: 'ngx-dataset',
  templateUrl: './dataset.component.html',
  styleUrls: ['./dataset.component.scss']
})
export class DatasetComponent implements OnInit {

  id:string;
  dataset:DCATDataset=new DCATDataset();
  loading=false;

  licenses:Array<any>=[];

  distributionPage:number =1;
  distributionPerPage:number =6;

  dataletBaseUrl=undefined;
  enableDatalet=false;

  samedomain=false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private restApi: DataCataglogueAPIService,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService,
    private configService: ConfigService
    ) { 
      this.dataletBaseUrl = configService.getSettings("datalet_base_url");
      this.enableDatalet = configService.getSettings("enable_datalet");
    }



  ngOnInit(): void {

    let dataletOrigin = new URLParse(this.dataletBaseUrl);
    //console.log(dataletOrigin.origin)
    if(location.origin==dataletOrigin.origin){
      this.samedomain=true;
    }

    this.route.paramMap.subscribe(params => {
      this.id = params.get('id'); 
      if (this.id) {
        this.getDataset();
      }else{
        this.loading=false;
        this.router.navigate(['/pages/datasets']);
      }
    })
  }

  getDataset(){
    this.loading=true;
    this.restApi.getDatasetById(this.id).subscribe(
      res=>{ 
        this.dataset=res;
        let tmpLic=[]
        this.dataset.distributions.forEach( x => {
          if(x.license!=undefined && x.license.name!='' && tmpLic.indexOf(x.license.name)<0){
           tmpLic.push(x.license.name);
           this.licenses.push({"name":x.license.name, "uri":x.license.uri});
          }
        })
        this.loading=false;
     },
      err=>{
         this.loading=false;
         this.toastrService.danger(err.error.userMessage,"Error")
         this.router.navigate(['/pages/datasets']);
       }
      )
  }

  openDistributionDetails(distribution:DCATDistribution){
    this.dialogService.open(DistributionComponent, {
      context: {
        distribution: distribution
      },
    });
  }

  printConcepts(themes: SKOSConcept[]){
    let ar=[];
    themes.map(x=> x.prefLabel.map( y =>{ if(y.value!='') ar.push(y.value) } ) );
    return ar.join(',')
  }

  showDate = function(date){
		if(date=='1970-01-01T00:00:00Z') return false;
		return true;
	}
  
  checkDistributionDatalet(distribution:DCATDistribution){
    let parameter=undefined;

    if(distribution.format!=undefined && distribution.format!=""){
			parameter=distribution.format;
		}else if(distribution.mediaType!=undefined && distribution.mediaType!=""){
			if(distribution.mediaType.indexOf("/")>0)
				parameter=distribution.mediaType.split("/")[1];
			else
				parameter=distribution.mediaType;
		}

    if(parameter!=undefined){
      switch(parameter.toLowerCase()){
        case 'xml':
        case 'csv':
        case 'json':
        case 'application/json':
        case 'text/json':
        case 'text/csv':
        case 'geojson':
        case 'fiware-ngsi':
        case 'kml':
          return true;
        default:
          if(parameter.toLowerCase().includes("csv")){
            return true;
          }
          return false;
        }
    }else{
      return false;
    }
  }

  dataletCreate(distribution: DCATDistribution) {

    var parameter = undefined;

    if (distribution.format != undefined && distribution.format != "") {
      parameter = distribution.format;
      if (parameter == 'fiware-ngsi') parameter = 'json';
    } else if (distribution.mediaType != undefined && distribution.mediaType != "") {
      if (distribution.mediaType.indexOf("/") > 0)
        parameter = distribution.mediaType.split("/")[1];
      else
        parameter = distribution.mediaType;
    }

    this.loading = true;
    if (this.samedomain) {
      this.restApi.downloadFromUri(distribution).subscribe(
        res => {
          this.loading = false;

          this.dialogService.open(DataletIframeComponent, {
            context: {
              distributionID: distribution.id,
              datasetID: this.dataset.id,
              nodeID: this.dataset.nodeID,
              format: parameter,
              url: distribution.downloadURL
            }
          })
            .onClose.subscribe(
              closeCallback => {
                this.getDataset()
              }
            );

        },
        err => {
          console.log(err)
          this.loading = false;
          this.toastrService.danger("File with url " + distribution.downloadURL + " returned " + err.status + "!", "Unable to create Datalet");
        }
      )
    } else {
      this.restApi.downloadFromUri(distribution).subscribe(
        res => {
          this.loading = false;
          window.open(`${this.dataletBaseUrl}?ln=en&format=${parameter}&nodeID=${this.dataset.nodeID}&distributionID=${distribution.id}&datasetID=${this.dataset.id}&url=${encodeURIComponent(distribution.downloadURL)}`)
        },
        err => {
          console.log(err)
          this.loading = false;
          this.toastrService.danger("File with url " + distribution.downloadURL + " returned " + err.status + "!", "Unable to create Datalet");
        }
      )
    }
  }

  openExistingDatalet(distribution:DCATDistribution){
    this.dialogService.open(ShowDataletsComponent, {
      context: {
        distributionID: distribution.id,
        datasetID:this.dataset.id,
        nodeID:this.dataset.nodeID
      }
    });
  }

}
