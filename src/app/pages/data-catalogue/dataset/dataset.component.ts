import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { ConfigService } from 'ngx-config-json';
import { DataletIframeComponent } from '../datalet-iframe/datalet-iframe.component';
import { DistributionComponent } from '../distribution/distribution.component';
import { DCATDataset } from '../model/dcatdataset';
import { DCATDistribution } from '../model/dcatdistribution';
import { SKOSConcept } from '../model/skosconcept';
import { DataCataglogueAPIService } from '../services/data-cataglogue-api.service';
import { ShowDataletsComponent } from '../show-datalets/show-datalets.component';
import * as URLParse from 'url-parse';
import { PreviewDialogComponent } from './preview-dialog/preview-dialog.component';
import { GeoJsonDialogComponent } from './geojson-dialog/geojson-dialog.component';
import { format } from 'path';
import { RefreshService } from '../../services/refresh.service';

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
  enableDatalet=true;

  samedomain=false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private restApi: DataCataglogueAPIService,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService,
    private configService: ConfigService<Record<string, any>>,
    private refreshService: RefreshService,
    ) { 
      this.dataletBaseUrl = this.configService.config["datalet_base_url"];
      this.enableDatalet = this.configService.config["enable_datalet"];
    }



  ngOnInit(): void {
    this.refreshService.refreshPageOnce('admin-configuration');

    let dataletOrigin = new URLParse(this.dataletBaseUrl);
    if(location.origin==dataletOrigin.origin){
      this.samedomain=true;
    }

    this.route.paramMap.subscribe(params => {
      this.id = params.get('id'); 
      if (this.id) {
        this.getDataset();
      }else{
        this.loading=false;
        this.router.navigate(['/pages/datasets'], 
        {
        queryParamsHandling: 'merge',
        });
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
         this.router.navigate(['/pages/datasets'], 
          {
          queryParamsHandling: 'merge',
          });
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

  downloadUrl(distribution:DCATDistribution){
    let url = distribution.downloadURL;
    if((distribution.downloadURL==undefined || distribution.downloadURL=='') && (distribution.accessURL!=undefined && distribution.accessURL!='')){
      url = distribution.accessURL;
    }
    // download file
    if(url!=undefined && url!=''){
      window.open(url);
    } else {
      this.toastrService.danger("No download URL found for this distribution","Error")
    }
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
          this.loading = false;
          this.toastrService.danger("File with url " + distribution.downloadURL + " returned " + err.status + "!", "Unable to create Datalet");
        }
      )
    }
  }

  openExistingDatalet(distribution:DCATDistribution){
    if(this.checkDistributionFormat(distribution.format)){
      this.dialogService.open(ShowDataletsComponent, {
        context: {
          distributionID: distribution.id,
          datasetID:this.dataset.id,
          nodeID:this.dataset.nodeID
        }
      });
    }
  }


	handlePreviewFileOpenModal(distribution: DCATDistribution) {
    // check if the distribution format is one of the following: CSV,JSON,XML,GEOJSON,RDF,KML,PDF
    let formatLower = distribution.format.replace(/\s/g, "").toLowerCase();
    if(formatLower == "geojson" || formatLower == "kml"  || formatLower == "shp"){
      this.dialogService.open(GeoJsonDialogComponent, {
        context: {
          title: distribution.title,
          distribution: distribution,
          type: formatLower,
        },
      })
      return;
    }
    else{
      if(this.checkDistributionFormat(distribution.format)){
        if(formatLower == "rdf"){
          this.restApi.downloadRDFfromUrl(distribution).subscribe(
            (res : string) => {
              console.log(res);
              this.dialogService.open(PreviewDialogComponent, {
                context: {
                  title: distribution.title,
                  text: res,
                },
              })
            },
            err => {
              this.toastrService.danger("Could not load the file", "Error");
            }
          )
        } else {
          this.dialogService.open(PreviewDialogComponent, {
            context: {
              title: distribution.title,
              url: distribution.accessURL,
            },
          })
        }
      }
    }
	}

  checkDistributionFormat(format:string){
    // remove white spaces and convert to lower case
    let formatLower = format.replace(/\s/g, "").toLowerCase();
    if(formatLower == "csv" || formatLower == "json" || formatLower == "xml" || formatLower == "geojson" || formatLower == "rdf" || formatLower == "kml" || formatLower == "pdf" || formatLower == "shp")
      return true;
    else
      return false;
    }


}



