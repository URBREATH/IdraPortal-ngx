import { Component, OnInit, ElementRef } from '@angular/core';
import { NbTagComponent, NbTagInputAddEvent } from '@nebular/theme';
import { DCATDataset,FormatCount } from '../model/dcatdataset';
import { ODMSCatalogueInfo } from '../model/odmscatalogue-info';
import { SearchFacet } from '../model/search-facet';
import { SearchFilter } from '../model/search-filter';
import { SearchRequest } from '../model/search-request';
import { SearchResult } from '../model/search-result';
import { DataCataglogueAPIService } from '../services/data-cataglogue-api.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ngx-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {


  searchResponse:SearchResult=new SearchResult();
  searchRequest:SearchRequest=new SearchRequest();

  cataloguesInfos: Array<ODMSCatalogueInfo>=[]

  constructor(private restApi:DataCataglogueAPIService,
    public router: Router,
    public translation: TranslateService,
  ) { }

  loading=false;

  facetLimits={};
  page=1;

  totalDatasets:number=0;
  currentDatasets:number=0;

  filters: Array<string> = [];
  filtersTags: Array<string>= [];

  pageSize: number = 10;
  currentPage: number = 1;

  ngOnInit(): void { 
    this.searchResponse.facets = [];
    this.loading=true
    this.restApi.getCataloguesInfo().subscribe(infos =>{
      this.cataloguesInfos = infos;
      this.searchRequest.nodes = infos.map(x=>x.id)
      this.loading=false

      let searchParam = this.router.routerState.snapshot.root.queryParams
      
      if(searchParam['advancedSearch'] == 'true'){
        this.searchRequest = JSON.parse(searchParam['params']);
        // this.filtersTags = searchParam['params'].filters.map(x=>x.value);
        this.searchDataset(true)
      } else{
        if(searchParam['type']!=undefined){
          this.searchRequest.filters.push(new SearchFilter('catalogues',searchParam.search_value))
          this.searchDataset(true)
        }
        else if(searchParam['name']!=undefined){
          // this.filtersTags.push(searchParam.name)
          this.searchRequest.filters.push(new SearchFilter('tags',searchParam.search_value))
          this.searchDataset(true)
        }
        else if(searchParam['text']!=undefined){
          // this.filtersTags.push(searchParam.value)
          this.searchRequest.filters.push(new SearchFilter('datasetThemes',searchParam.value))
          this.searchDataset(true)
        }
        else if(searchParam['tags']!=undefined){
          let tags = searchParam.tags.split(',')
          // tags.forEach(element => {
          //   this.filtersTags.push(element)
          // });
          this.searchRequest.filters.push(new SearchFilter('tags',searchParam.tags))
          this.searchDataset(true)
        } else{
          this.searchDataset(true)
        }
      }

    },err=>{
      console.log(err);
      this.loading=false;
    })
  }

  updateFilters(tags){
      this.filters= tags;
      this.searchDataset()
  }

  pageChanged($event: number): void {
    this.currentPage = $event;
    this.page = $event;
    this.searchRequest.start = ($event - 1) * this.searchRequest.rows;
    this.searchDataset();
  }

  searchDataset(isFirst=false) : Observable<SearchResult>{
    this.loading=true
    this.filtersTags=[];

    this.searchRequest.filters.forEach(x=>{
      if(x.field=='ALL' && x.value!=''){
        let values = x.value.split(',')
        values.forEach(y=> this.filtersTags.push(y))
      } else if(x.value!=''){
        let values = x.value.split(',')
        let name=x.field;
        let index = this.searchResponse.facets.findIndex(x=> x.search_parameter===name)
        if(index>=0){
          name=this.searchResponse.facets[index].displayName;
        }
        values.forEach(y=> this.filtersTags.push(name+": "+y))
      }
    })

    this.restApi.searchDatasets(this.searchRequest).subscribe(
      res=>{
        this.searchResponse=res
        this.currentDatasets = this.searchResponse.count;  
        if(isFirst){
          this.totalDatasets = this.searchResponse.count;  
        }
        this.searchResponse.results.map((x:DCATDataset)=>{ this.processDataset(x) })
        this.loading=false;
      },
      err=>{
        console.log(err);
        this.loading=false;
      });
// create an observable of this.searchResponse

      return new Observable<SearchResult>(observer => {
        observer.next(this.searchResponse);
        observer.complete();
      });
  }

  onTagRemove(tagToRemove: NbTagComponent): void {
    this.filters = this.filters.filter(x => x!=tagToRemove.text);
    this.searchRequest.filters.map(x =>{ 
      if(x.field=='ALL'){
        let a = x.value.split(',');
        x.value = a.filter(b => b!=tagToRemove.text).join(',');
      }
    })

    this.searchDataset()
  }

  onTagAdd({ value, input }: NbTagInputAddEvent): void {
    //added timeout since comma doesn't desapear from input
    setTimeout(()=>{
      if(input != undefined )
      input.nativeElement.value = ''
      if (value) {
        this.filters.push(value);
        this.searchRequest.filters.map(x => {
          if (x.field == 'ALL') {
            if (x.value != '') {
              let a = x.value.split(',');
              a.push(value)
              x.value = a.join(',');
            } else {
              x.value = value;
            }
          }
        })
        this.searchDataset()
      }
    }, 50);

    
  }


  getFacetsLimit(facet){
    if(this.facetLimits[facet]==undefined){
      this.facetLimits[facet]=10;
    }
    return this.facetLimits[facet];
  }

  setFacetsLimit(facet,value){
    this.facetLimits[facet]=value;
  }


  processDataset(dataset:DCATDataset):DCATDataset{
    let tmp=[];
    dataset.distributionFormats=[];
    for(let d of dataset.distributions){
      if(tmp.indexOf(d.format)<0){
        let fC=new FormatCount();
        fC.format=d.format;
        fC.count=1;
        dataset.distributionFormats.push(fC);
        tmp.push(d.format);
      }else{
        dataset.distributionFormats[tmp.indexOf(d.format)].count++;
      }
    }

    dataset.description = dataset.description.replace(/\*/g,'').replace(/\\n/g,'')
																				.replace(/\(http.*\)/g,'').replace(/##\s*/g,'')
																				.replace(/<.*>(.*)<\/.*>/g,'$1')
																				.replace(/>/g,'').replace(/\[|\]/g,'')

    return dataset;
  }

  getColor(format:string):string{
    switch(format.toLowerCase()){
      case 'csv':
        return '#dfb100';
      case 'html':
        return '#55a1ce';
      case 'json':
      case 'xml':
        return '#ef7100';
      case 'text':
      case 'txt':
        return '#74cbec';
      case 'xls':
      case 'xlsx':
        return '#2db55d';
      case 'zip':
        return '#686868';
      case 'api':
        return 'ec96be';
      case 'pdf':
        return '#e0051e';
      case 'rdf':
      case 'nquad':
      case 'turtle':
      case 'ntriples':
        return '#0b4498';
      case 'fiware':
      case 'ngsi':
      case 'ngsi-ld':
      case 'fiware-ngsi':
      case 'fiware-ngsi-ld':
        return '#65c3d1';
      default:
        return 'default';
    }
  }

  onFilterRemove(filter: NbTagComponent): void {
    let tmp=filter.text.split(': ');
    let name = tmp[0];
    let facetIndex = this.searchResponse.facets.findIndex(x=>x.displayName==name)
    if(facetIndex>=0){
      name=this.searchResponse.facets[facetIndex].search_parameter;
    }
    let index = this.searchRequest.filters.findIndex(x=> x.field==name);
    let filterTag = this.searchRequest.filters[index];
    this.searchRequest.filters[index].value=filterTag.value.split(',').filter(x=> x!=tmp[1]).join(',');
    if(this.searchRequest.filters[index].value==''){
      this.searchRequest.filters.splice(index,1);
    }
    this.searchDataset()
  }

  getDatasetByFacet(search_parameter,newValue){
    this.page=1;
    this.searchRequest.start=0;
    let index = this.searchRequest.filters.findIndex(x=> x.field===search_parameter);
    if(index<0){
      this.searchRequest.filters.push(new SearchFilter(search_parameter,newValue));
    }else{
      let filter=this.searchRequest.filters[index];
      this.searchRequest.filters.splice(index,1)
      let tmp=filter.value.split(',');
      tmp.push(newValue);
      filter.value=tmp.join(',');
      this.searchRequest.filters.push(filter);
    }
    this.searchDataset()
  }

  displayFacet(search_parameter,value){
    let index = this.searchRequest.filters.findIndex(x=> x.field===search_parameter);
    if(index<0) return true;
    else{
      let values=this.searchRequest.filters[index].value.split(',');
      let vIndex = values.findIndex(x=>x===value)
      if(vIndex<0) return true;
    }
    return false;
  }

  filterFacets(search_parameter,values:SearchFacet[]){
    let index = this.searchRequest.filters.findIndex(x=> x.field===search_parameter);
    if(index<0) return values;
    else{
      let usedValues=this.searchRequest.filters[index].value.split(',');
      return values.filter( x=> usedValues.indexOf(x.search_value)<0 );
    }
  }
}
