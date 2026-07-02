import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { DxfDialogComponent } from './dxf-dialog/dxf-dialog.component';
import { RefreshService } from '../../services/refresh.service';
import { DatasourceService } from '../../services/datasource.service';
import { ModelsService } from '../../services/models.service';
import { NgsiDatasetsService } from '../../services/ngsi-datasets.service';
import * as L from 'leaflet';


@Component({
  selector: 'ngx-dataset',
  templateUrl: './dataset.component.html',
  styleUrls: ['./dataset.component.scss']
})
export class DatasetComponent implements OnInit, OnDestroy {

  id:string;
  dataset:DCATDataset=new DCATDataset();
  loading=false;

  ngsiDataset:any;
  dataSource:any;
  model:any={};
  public map: L.Map;

  licenses:Array<any>=[];

  distributionPage:number =1;
  distributionPerPage:number =6;

  dataletBaseUrl=undefined;
  enableDatalet=true;

  samedomain=false;
  isSpecialDatasetType: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private restApi: DataCataglogueAPIService,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService,
    private configService: ConfigService<Record<string, any>>,
    private refreshService: RefreshService,
    private datasourceService: DatasourceService,
    private modelsService: ModelsService,
    private ngsiDatasetsService: NgsiDatasetsService
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
        this.cleanupMap();
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

      ngOnDestroy(): void {
        this.cleanupMap();
      }
    
      private cleanupMap(): void {
        if (this.map) {
          this.map.remove();
          this.map = null;
        }
      }

      getDataset(){
        this.loading=true;
        this.restApi.getDatasetById(this.id).subscribe(
      res=>{ 
        this.dataset=res;
        this.dataset.distributions = this.filterDisplayDistributions(this.dataset.distributions || []);
        switch(this.dataset.nodeName.replace(/\s/g, "").toLowerCase()){
          case "datasources":
            this.getDataSource();
            this.isSpecialDatasetType = true;
            break;
          case "modelsandtools":
            this.getModels();
            this.isSpecialDatasetType = true;
            break;
          case "datasets":
          default:
            this.getNgsiDataset();
            this.isSpecialDatasetType = true;
            break;
        }
        
        console.log('Dataset: ', this.dataset);
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

  private filterDisplayDistributions(distributions: DCATDistribution[]): DCATDistribution[] {
    let filteredDistributions = distributions;

    const gmlDistributions = distributions.filter(distribution => this.isGmlLikeDistribution(distribution));
    if (gmlDistributions.length > 1) {
      const validCandidates = gmlDistributions.filter(distribution => !this.isNonFeatureGmlDistribution(distribution));
      const preferred = validCandidates.find(distribution => this.isGetFeatureDistribution(distribution)) ||
        validCandidates[validCandidates.length - 1] ||
        gmlDistributions[gmlDistributions.length - 1];

      filteredDistributions = filteredDistributions.filter(distribution =>
        !this.isGmlLikeDistribution(distribution) ||
        distribution === preferred
      );
    }

    const wmsDistributions = filteredDistributions.filter(distribution => this.isWmsLikeDistribution(distribution));
    if (wmsDistributions.length > 1) {
      const preferred = wmsDistributions.find(distribution => this.isGetCapabilitiesDistribution(distribution)) ||
        wmsDistributions[0];

      filteredDistributions = filteredDistributions.filter(distribution =>
        !this.isWmsLikeDistribution(distribution) ||
        distribution === preferred
      );
    }

    return filteredDistributions;
  }

  private isGmlLikeDistribution(distribution: DCATDistribution): boolean {
    const format = this.getDistributionFormat(distribution);
    const rawFormat = this.normalizeDistributionFormat(distribution && distribution.format);
    const mediaType = this.normalizeDistributionFormat(distribution && distribution.mediaType);
    const value = [
      distribution && distribution.title,
      distribution && distribution.downloadURL,
      distribution && distribution.accessURL,
    ].join(' ').toLowerCase();

    return format === 'gml' ||
      rawFormat.indexOf('gml') >= 0 ||
      mediaType.indexOf('gml') >= 0 ||
      value.indexOf('gml') >= 0;
  }

  private isNonFeatureGmlDistribution(distribution: DCATDistribution): boolean {
    const url = distribution && (distribution.downloadURL || distribution.accessURL || '');
    const lowerValue = [
      distribution && distribution.title,
      distribution && distribution.description,
      url,
    ].join(' ').toLowerCase();

    if (lowerValue.indexOf('getcapabilities') >= 0 ||
      lowerValue.indexOf('describefeaturetype') >= 0 ||
      lowerValue.indexOf('schema') >= 0 ||
      lowerValue.indexOf('.xsd') >= 0) {
      return true;
    }

    try {
      const parsedUrl = new URLParse(url, true);
      const request = this.getQueryParamValue(parsedUrl.query || {}, 'request').toLowerCase();
      return request === 'getcapabilities' || request === 'describefeaturetype';
    } catch (e) {
      return false;
    }
  }

  private isGetFeatureDistribution(distribution: DCATDistribution): boolean {
    const url = distribution && (distribution.downloadURL || distribution.accessURL || '');
    const lowerValue = [
      distribution && distribution.title,
      distribution && distribution.description,
      url,
    ].join(' ').toLowerCase();

    if (lowerValue.indexOf('getfeature') >= 0 ||
      lowerValue.indexOf('featurecollection') >= 0) {
      return true;
    }

    try {
      const parsedUrl = new URLParse(url, true);
      return this.getQueryParamValue(parsedUrl.query || {}, 'request').toLowerCase() === 'getfeature';
    } catch (e) {
      return false;
    }
  }

  private isWmsLikeDistribution(distribution: DCATDistribution): boolean {
    const format = this.getDistributionFormat(distribution);
    const rawFormat = this.normalizeDistributionFormat(distribution && distribution.format);
    const mediaType = this.normalizeDistributionFormat(distribution && distribution.mediaType);
    const value = [
      distribution && distribution.title,
      distribution && distribution.downloadURL,
      distribution && distribution.accessURL,
    ].join(' ').toLowerCase();

    return format === 'wms' ||
      rawFormat.indexOf('wms') >= 0 ||
      mediaType.indexOf('wms') >= 0 ||
      value.indexOf('service=wms') >= 0 ||
      value.indexOf('request=getcapabilities') >= 0;
  }

  private isGetCapabilitiesDistribution(distribution: DCATDistribution): boolean {
    const url = distribution && (distribution.downloadURL || distribution.accessURL || '');
    const lowerValue = [
      distribution && distribution.title,
      distribution && distribution.description,
      url,
    ].join(' ').toLowerCase();

    if (lowerValue.indexOf('getcapabilities') >= 0) {
      return true;
    }

    try {
      const parsedUrl = new URLParse(url, true);
      return this.getQueryParamValue(parsedUrl.query || {}, 'request').toLowerCase() === 'getcapabilities';
    } catch (e) {
      return false;
    }
  }

  private getQueryParamValue(query: any, name: string): string {
    const foundKey = Object.keys(query || {}).find(key => key.toLowerCase() === name.toLowerCase());
    const value = foundKey ? query[foundKey] : '';
    return value === undefined || value === null ? '' : String(value);
  }

  
  getDataSource(){
    this.loading=true;
    this.datasourceService.getSingleEntity(this.dataset.identifier).subscribe(
      res=>{ 
        this.dataSource=res;
        console.log('DataSource: ', JSON.stringify(this.dataSource));
        this.loading=false;
        if (this.dataSource.spatial && this.dataSource.spatial.value) {
          setTimeout(() => this.initMap(this.dataSource.spatial.value), 0);
        }
      },
      err=>{
        this.loading=false;
        console.warn('Could not load datasource details', err);
      }
    );
  }

  getModels(){
    this.loading=true;
    this.modelsService.getSingleEntity(this.dataset.identifier).subscribe(
      res=>{ 
        this.model=res;
        console.log('Model: ', JSON.stringify(this.model));
        this.loading=false;
      },
      err=>{
        this.loading=false;
        console.warn('Could not load model details', err);
      }
    );
  }

  getNgsiDataset(){
    this.loading=true;
    this.ngsiDatasetsService.getSingleEntity(this.dataset.identifier).subscribe(
      res=>{ 
        this.ngsiDataset=res;
        console.log('Dataset NGSI: ', this.ngsiDataset);
        console.log('Dataset NGSI: ', JSON.stringify(this.ngsiDataset));
        this.loading=false;
        if (this.ngsiDataset.spatial && this.ngsiDataset.spatial.value) {
          setTimeout(() => this.initMap(this.ngsiDataset.spatial.value), 0);
        }
      },
      err=>{
        this.loading=false;
        console.warn('Could not load NGSI dataset details', err);
      }
    );
  }

  openDistributionDetails(distribution:DCATDistribution){
    this.dialogService.open(DistributionComponent, {
      context: {
        distribution: distribution,
        datasetType: this.dataset.nodeName // Pass the dataset type (datasources, modelsandtools, datasets)
      },
    });
  }

  checkDistributionDownload(distribution:DCATDistribution){
    switch(distribution.format.replace(/\s/g, "").toLowerCase()){
      //these are all model/tools formats that cannot be downloaded
      case "videotutorial":
      case "documentation":
      case "endpoint":
      case "guide":
      case "userdocumentation":
      case "apidocumentation":
      case "coderepository":
      case "other":
      case "youtube":
        return true;
    }
    return false;
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
    if (!this.canPreviewDistribution(distribution)) {
      return;
    }

    // check if the distribution format is one of the following: CSV,JSON,XML,GEOJSON,RDF,KML,PDF
    let formatLower = this.getDistributionFormat(distribution);
    
    // For documentation, guides, API docs, code repositories, and other formats
    // directly open the link in a new tab instead of showing the preview dialog
    if (["documentation", "guide", "apidocumentation", "coderepository", "other"].includes(formatLower)) {
      let url = distribution.downloadURL;
      if (url) {
        window.open(url, '_blank');
        return;
      }
    }
    
    // Special handling for endpoints - show a simplified view with the URL and a Test button
    if (formatLower === "endpoint") {
      // Get the URL from either downloadURL or accessURL
      let endpointUrl = distribution.downloadURL || distribution.accessURL || '';
      if (endpointUrl) {
        this.dialogService.open(PreviewDialogComponent, {
          context: {
            title: distribution.title,
            isEndpoint: true,
            endpointUrl: endpointUrl
          },
        });
        return;
      }
    }
    
    // Check if the URL is a YouTube link - try both accessURL and downloadURL
    const accessUrl = distribution.accessURL || '';
    const downloadUrl = distribution.downloadURL || '';
    
    // First check if either URL is a YouTube link
    if(this.isYouTubeUrl(accessUrl) || this.isYouTubeUrl(downloadUrl)) {
      // Try to extract the YouTube video ID from both URLs
      let youtubeVideoId = this.extractYouTubeVideoId(accessUrl);
      
      // If not found in accessURL, try downloadURL
      if (!youtubeVideoId) {
        youtubeVideoId = this.extractYouTubeVideoId(downloadUrl);
      }
      
      if(youtubeVideoId) {
        // Use youtube-nocookie.com for privacy-enhanced mode which reduces tracking errors
        const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeVideoId}`;
        this.dialogService.open(PreviewDialogComponent, {
          context: {
            title: distribution.title,
            youtubeUrl: embedUrl,
          },
        });
        return;
      }
    }
    
    if(formatLower == "geojson" || formatLower == "kml" || formatLower == "gml" || formatLower == "wms" || formatLower == "shp"){
      this.dialogService.open(GeoJsonDialogComponent, {
        context: {
          title: distribution.title,
          distribution: distribution,
          type: formatLower,
        },
      })
      return;
    }
    if(formatLower == "dxf"){
      this.dialogService.open(DxfDialogComponent, {
        context: {
          title: distribution.title,
          distribution: distribution,
        },
      })
      return;
    }
    else{
      if(this.checkDistributionFormat(formatLower)){
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
        } else if (formatLower == "csv") {
          this.dialogService.open(PreviewDialogComponent, {
            context: {
              title: distribution.title,
              csvDistribution: distribution,
            },
          })
        } else if (formatLower == "json") {
          this.dialogService.open(PreviewDialogComponent, {
            context: {
              title: distribution.title,
              jsonDistribution: distribution,
            },
          })
        } else if (formatLower == "html") {
          this.dialogService.open(PreviewDialogComponent, {
            context: {
              title: distribution.title,
              htmlUrl: distribution.accessURL || distribution.downloadURL,
            },
          })
        } else if (this.isImagePreviewFormat(formatLower)) {
          this.dialogService.open(PreviewDialogComponent, {
            context: {
              title: distribution.title,
              imageUrl: distribution.accessURL || distribution.downloadURL,
              imageType: formatLower,
            },
          })
        } else {
          this.dialogService.open(PreviewDialogComponent, {
            context: {
              title: distribution.title,
              url: distribution.accessURL || distribution.downloadURL,
            },
          })
        }
      }
    }
	}

  canPreviewDistribution(distribution: DCATDistribution): boolean {
    if (!distribution) {
      return false;
    }

    const formatLower = this.getDistributionFormat(distribution);
    const accessUrl = distribution.accessURL || '';
    const downloadUrl = distribution.downloadURL || '';
    const hasAnyUrl = !!(accessUrl || downloadUrl);

    if (!formatLower || !this.checkDistributionFormat(formatLower)) {
      return false;
    }

    if (this.isYouTubeUrl(accessUrl) || this.isYouTubeUrl(downloadUrl)) {
      return true;
    }

    switch (formatLower) {
      case 'endpoint':
      case 'videotutorial':
      case 'documentation':
      case 'guide':
      case 'userdocumentation':
      case 'apidocumentation':
      case 'coderepository':
      case 'other':
      case 'youtube':
      case 'video':
      case 'csv':
      case 'json':
      case 'xml':
      case 'html':
      case 'jpeg':
      case 'jpg':
      case 'png':
      case 'tiff':
      case 'tif':
      case 'dxf':
      case 'pdf':
      case 'kml':
      case 'gml':
      case 'wms':
      case 'geojson':
        return hasAnyUrl;
      case 'rdf':
      case 'shp':
        return !!downloadUrl;
      default:
        return false;
    }
  }

  checkDistributionFormat(format: string) {
    // remove white spaces and convert to lower case
    let formatLower = this.normalizeDistributionFormat(format);
    switch (formatLower) {
      case "endpoint":
      case "videotutorial":
      case "documentation":
      case "guide":
      case "userdocumentation":
      case "apidocumentation":
      case "coderepository":
      case "other":
      case "youtube":
      case "video":
      case "csv":
      case "text/csv":
      case "json":
      case "application/json":
      case "text/json":
      case "xml":
      case "application/xml":
      case "text/xml":
      case "html":
      case "text/html":
      case "jpeg":
      case "jpg":
      case "image/jpeg":
      case "png":
      case "image/png":
      case "tiff":
      case "tif":
      case "image/tiff":
      case "dxf":
      case "application/dxf":
      case "application/x-dxf":
      case "image/vnd.dxf":
      case "geojson":
      case "rdf":
      case "application/rdf+xml":
      case "kml":
      case "wms":
      case "ogc:wms":
      case "application/vnd.ogc.wms_xml":
      case "application/vnd.ogc.wms":
      case "gml":
      case "application/gml+xml":
      case "application/vnd.ogc.gml":
      case "application/vnd.ogc.gml/3.2":
      case "pdf":
      case "shp":
        return true;
      default:
        return false;
    }
  }

  private getDistributionFormat(distribution: DCATDistribution): string {
    const format = this.normalizeDistributionFormat(distribution && distribution.format);
    if (format) {
      return this.normalizePreviewFormat(format);
    }

    const mediaType = this.normalizeDistributionFormat(distribution && distribution.mediaType);
    if (mediaType) {
      return this.normalizePreviewFormat(mediaType);
    }

    const url = distribution && (distribution.downloadURL || distribution.accessURL);
    if (!url) {
      return '';
    }

    try {
      const parsedUrl = new URLParse(url, true);
      const serviceKey = Object.keys(parsedUrl.query || {}).find(key => key.toLowerCase() === 'service');
      if (serviceKey && String(parsedUrl.query[serviceKey]).toLowerCase() === 'wms') {
        return 'wms';
      }
    } catch (e) {}

    const cleanUrl = url.split('#')[0].split('?')[0];
    const fileName = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
    const lastDot = fileName.lastIndexOf('.');
    return lastDot >= 0 ? this.normalizePreviewFormat(this.normalizeDistributionFormat(fileName.slice(lastDot + 1))) : '';
  }

  private normalizeDistributionFormat(format: string): string {
    return (format || '').replace(/\s/g, "").toLowerCase();
  }

  private normalizePreviewFormat(format: string): string {
    switch (format) {
      case 'application/json':
      case 'text/json':
        return 'json';
      case 'text/csv':
        return 'csv';
      case 'application/xml':
      case 'text/xml':
        return 'xml';
      case 'text/html':
        return 'html';
      case 'image/jpeg':
        return 'jpeg';
      case 'image/png':
        return 'png';
      case 'image/tiff':
        return 'tiff';
      case 'application/dxf':
      case 'application/x-dxf':
      case 'image/vnd.dxf':
        return 'dxf';
      case 'application/rdf+xml':
      case 'rdf+xml':
        return 'rdf';
      case 'application/gml+xml':
      case 'application/vnd.ogc.gml':
      case 'application/vnd.ogc.gml/3.2':
        return 'gml';
      case 'ogc:wms':
      case 'application/vnd.ogc.wms_xml':
      case 'application/vnd.ogc.wms':
        return 'wms';
      default:
        if (format.indexOf('wms') >= 0) {
          return 'wms';
        }
        return format;
    }
  }

  private isImagePreviewFormat(format: string): boolean {
    return ['jpeg', 'jpg', 'png', 'tiff', 'tif'].indexOf(format) >= 0;
  }

  // Helper method to check if a URL is a YouTube link
  isYouTubeUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const parsedUrl = new URLParse(url);
      const hostname = parsedUrl.hostname;
      
      return hostname.includes('youtube.com') || 
             hostname.includes('youtu.be') || 
             hostname.includes('youtube-nocookie.com');
    } catch (e) {
      return false;
    }
  }

  // Helper method to extract the YouTube video ID from a URL
  extractYouTubeVideoId(url: string): string | null {
    if (!url) return null;
    
    try {
      // First try to match using regex patterns for common YouTube URL formats
      const regexPatterns = [
        // youtube.com/watch?v=VIDEO_ID
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\/]+)/i,
        // youtube.com/v/VIDEO_ID
        /youtube\.com\/v\/([^&?\/]+)/i,
        // youtube.com/shorts/VIDEO_ID
        /youtube\.com\/shorts\/([^&?\/]+)/i
      ];
      
      for (const pattern of regexPatterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      // If regex didn't work, try URL parsing approach
      const parsedUrl = new URLParse(url, true);
      
      // Handle youtube.com/watch?v=VIDEO_ID
      if (parsedUrl.hostname.includes('youtube.com') && parsedUrl.pathname.includes('/watch')) {
        return parsedUrl.query.v || null;
      }
      
      // Handle youtu.be/VIDEO_ID
      if (parsedUrl.hostname.includes('youtu.be')) {
        const path = parsedUrl.pathname;
        if (path && path.length > 1) {
          return path.substring(1);
        }
      }
      
      // Handle youtube.com/embed/VIDEO_ID
      if (parsedUrl.pathname.includes('/embed/')) {
        const parts = parsedUrl.pathname.split('/');
        for (let i = 0; i < parts.length; i++) {
          if (parts[i] === 'embed' && i+1 < parts.length) {
            return parts[i+1];
          }
        }
      }
      
      return null;
    } catch (e) {
      console.error('Error extracting YouTube video ID:', e);
      return null;
    }
  }

    private initMap(spatialData: any): void {
      // Fix marker icon issue by setting the default icon using CDN URLs
      const iconDefault = L.icon({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
      });
      L.Marker.prototype.options.icon = iconDefault;
  
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        return;
      }
      this.cleanupMap();
      
      // Initialize the map with OpenStreetMap tiles
      this.map = L.map("map", {
        center: [52, 12],
        zoom: 3,
        layers: [L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
        })],
      });
  
      const geometry = new L.FeatureGroup();
      
      if (spatialData) {
        const geojsonFeature = {
          "type": "Feature",
          "properties": {},
          "geometry": spatialData
        };
  
        const spatialLayer = L.geoJSON(geojsonFeature as any);
        geometry.addLayer(spatialLayer);
        this.map.fitBounds(geometry.getBounds());
      }
  
      this.map.addLayer(geometry);
    }


}



