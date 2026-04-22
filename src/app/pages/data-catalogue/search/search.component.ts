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
import { forkJoin, Observable } from 'rxjs';
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
  catalogueDatasetCounts: Record<string, number> = {};

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
    this.loading = true;
    this.searchRequest.rows = this.pageSize;
    forkJoin({
      infos: this.restApi.getCataloguesInfo(),
      cataloguesResponse: this.restApi.getCatalogues(),
    }).subscribe(({ infos, cataloguesResponse }) => {
      this.cataloguesInfos = infos;
      this.catalogueDatasetCounts = this.buildCatalogueDatasetCounts(cataloguesResponse.catalogues);
      this.searchRequest.nodes = infos.map(x => x.id);
      this.loading = false;

      const searchParams = this.router.routerState.snapshot.root.queryParams;
      const lastSearch = localStorage.getItem('lastSearch');

      this.initializeSearchState(searchParams, lastSearch);
      this.searchDataset(true);
    }, err => {
      console.log(err);
      this.loading = false;
    });
  }

  private buildCatalogueDatasetCounts(catalogues: any[] = []): Record<string, number> {
    return catalogues.reduce<Record<string, number>>((counts, catalogue) => {
      if (catalogue?.name) {
        counts[this.normalizeCatalogueKey(catalogue.name)] = catalogue.datasetCount ?? 0;
      }
      return counts;
    }, {});
  }

  private normalizeCatalogueKey(value: string): string {
    return value?.trim().toLowerCase() ?? '';
  }

  private cleanFacetLabel(value?: string): string {
    return value?.replace(/\s*\(\d+\)\s*$/, '') ?? '';
  }

  getFacetLabel(searchParameter: string, item: SearchFacet): string {
    if (searchParameter !== 'catalogues') {
      return item.facet ?? '';
    }

    const baseLabel = item.search_value || this.cleanFacetLabel(item.facet);
    const datasetCount = this.catalogueDatasetCounts[this.normalizeCatalogueKey(baseLabel)];

    if (datasetCount === undefined) {
      return item.facet || baseLabel;
    }

    return `${baseLabel} (${datasetCount})`;
  }

  private initializeSearchState(searchParams: any, lastSearch: string | null): void {
    const nodes = this.searchRequest.nodes ? [...this.searchRequest.nodes] : [];

    this.searchRequest = new SearchRequest();
    this.searchRequest.rows = this.pageSize;
    this.searchRequest.nodes = nodes;
    this.filters = [];
    this.filtersTags = [];

    if (searchParams['advancedSearch'] === 'true' && searchParams['params']) {
      this.searchRequest = JSON.parse(searchParams['params']);
      this.searchRequest.rows = this.pageSize;
      this.searchRequest.start = this.searchRequest.start ?? 0;
      this.searchRequest.nodes = this.searchRequest.nodes?.length ? this.searchRequest.nodes : nodes;
      this.processSearchRequestFilters();
      return;
    }

    if (searchParams['type'] != undefined) {
      this.searchRequest.filters = [new SearchFilter('catalogues', searchParams.search_value)];
      return;
    }

    if (searchParams['name'] != undefined) {
      this.searchRequest.filters = [new SearchFilter('tags', searchParams.search_value)];
      return;
    }

    if (searchParams['text'] != undefined) {
      this.searchRequest.filters = [new SearchFilter('datasetThemes', searchParams.value)];
      return;
    }

    if (searchParams['tags'] != undefined) {
      const tags = searchParams['tags'].split(',').filter(tag => tag.trim() !== '');
      this.filters = [...tags];
      this.searchRequest.filters = [new SearchFilter('ALL', tags.join(','))];
      return;
    }

    if (lastSearch && lastSearch.trim() !== '') {
      const tags = lastSearch.split(',').filter(tag => tag.trim() !== '');
      this.filters = [...tags];
      this.searchRequest.filters = [new SearchFilter('ALL', tags.join(','))];
      return;
    }

    this.searchRequest.filters = [new SearchFilter('ALL', '')];
  }

  private processSearchRequestFilters(): void {
    if (!this.searchRequest.filters || this.searchRequest.filters.length === 0) {
      this.searchRequest.filters = [new SearchFilter('ALL', '')];
      return;
    }

    this.searchRequest.filters.forEach(filter => {
      if (filter.field === 'ALL') {
        const values = filter.value.split(',');
        values.forEach(value => {
          const trimmedValue = value.trim();
          if (trimmedValue !== '') {
            this.filters.push(trimmedValue);
          }
        });
        return;
      }

      if (filter.field && filter.value) {
        const values = filter.value.split(',');
        values.forEach(value => {
          const trimmedValue = value.trim();
          if (trimmedValue !== '') {
            this.filtersTags.push(`${filter.field}: ${trimmedValue}`);
          }
        });
      }
    });

    this.searchRequest.filters = this.searchRequest.filters.filter(filter =>
      filter.value && filter.value.trim() !== ''
    );

    if (this.searchRequest.filters.length === 0) {
      this.searchRequest.filters = [new SearchFilter('ALL', '')];
    }

    this.createDateRangeTags();
  }

  updateFilters(tags){
      this.filters= tags;
      this.searchDataset()
  }

  pageChanged($event: number): void {
    this.currentPage = $event;
    this.page = $event;
    this.searchRequest.rows = this.pageSize;
    this.searchRequest.start = ($event - 1) * this.searchRequest.rows;
    this.searchDataset();
  }

  searchDataset(isFirst=false) : Observable<SearchResult>{
    console.log(this.searchRequest)
    console.log(this.filters)
    console.log(this.filtersTags)
    console.log(this.searchResponse)
    console.log(this.searchResponse.facets)
    this.loading=true
    this.filtersTags=[];

    //console.log("Search Request before processing: ", this.searchRequest);

    // Clean up empty filters before making the request
    this.searchRequest.filters = this.searchRequest.filters.filter(filter => 
      filter.value && filter.value.trim() !== ''
    );

    // If no filters remain, add the default empty ALL filter
    if (this.searchRequest.filters.length === 0) {
      this.searchRequest.filters.push({field: 'ALL', value: ''});
    }

    console.log("Search Request: ", this.searchRequest);

    // Process regular filters
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

    // Add date range tags
    this.createDateRangeTags();

    this.restApi.searchDatasets(this.searchRequest).subscribe(
      res=>{
        this.searchResponse=res
        this.searchResponse.count <= 10 && console.log(this.searchResponse);
        this.currentDatasets = this.searchResponse.count;  
        // Update totalDatasets on every search, not just the first one
        this.totalDatasets = this.searchResponse.count;  
        this.searchResponse.results.map((x:DCATDataset)=>{ this.processDataset(x) })
        this.loading=false;
      },
      err=>{
        console.log(err);
        this.loading=false;
      });

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

    localStorage.setItem('lastSearch', this.filters.toString());

    this.currentPage = 1;
    this.page = 1;
    this.searchRequest.start = 0;

    this.searchDataset()
  }

  onTagInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',' || event.keyCode === 13 || event.keyCode === 188) {
      event.preventDefault();
    }
  }

  onTagAdd({ value, input }: NbTagInputAddEvent): void {
    if (input?.nativeElement) {
      input.nativeElement.value = '';
    }

    const trimmedValue = value?.trim();
    if (!trimmedValue) {
      return;
    }

    this.filters.push(trimmedValue);
  
    // Check if there's a filter with field 'ALL'
    let allFilter = this.searchRequest.filters.find(x => x.field == 'ALL');
  
    if (allFilter) {
      // Update existing 'ALL' filter - always append to existing value
      if (allFilter.value && allFilter.value.trim() !== '') {
        let existingValues = allFilter.value.split(',').filter(v => v.trim() !== '');
        existingValues.push(trimmedValue);
        allFilter.value = existingValues.join(',');
      } else {
        allFilter.value = trimmedValue;
      }
    } else {
      // Create a new 'ALL' filter if it doesn't exist
      this.searchRequest.filters.push(new SearchFilter('ALL', trimmedValue));
    }
    
    localStorage.setItem('lastSearch', this.filters.toString());

    this.currentPage = 1;
    this.page = 1;
    this.searchRequest.start = 0;

    this.searchDataset();
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

  nonEmptyThemes(themes):any[]{
    if(themes==undefined) return [];
    return themes.filter(x=> x.prefLabel!=undefined && x.prefLabel.length>0 && x.prefLabel[0].value.trim()!='');
  }

  getColor(format:string):string{
    switch(format.toLowerCase()){
      case 'agri':
        return '#74cbec';
      case 'econ':
        return '#2db55d';
      case 'educ':
        return '#ef7100';
      case 'envi':
        return '#dfb100';
      case 'ener':
        return '#55a1ce';
      case 'gove':
        return '#2db55d';
      case 'heal':
        return '#686868';
      case 'just':
        return '#ec96be';
      case 'intr':
        return '#e0051e';
      case 'regi':
        return '#fd455f';
      case 'soci':
        return '#d00666';
      case 'tech':
        return '#fg4a52';
      case 'tran':
        return '#bfa500';
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
    // Check if it's a date range tag first
    if (this.handleDateRangeTagRemoval(filter.text)) {
      this.searchDataset();
      return;
    }

    // Handle regular filter tags
    let tmp=filter.text.split(': ');
    if(tmp.length<2) {
      this.onTagRemove(filter);
      return;
    }
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
    localStorage.setItem('lastSearch', this.searchRequest.filters.map(x => x.value.trim()).filter(v => v !== '').join(','));
    this.searchDataset();
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
    localStorage.setItem(
      'lastSearch',
      this.searchRequest.filters
        .map(x => x.value.trim())
        .filter(v => v !== '')
        .join(',')
    );
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

  /**
   * Create date range tags during initialization and search
   */
  private createDateRangeTags(): void {
    // Handle release date
    if (this.searchRequest.releaseDate) {
      const startDate = new Date(this.searchRequest.releaseDate.start).toLocaleDateString();
      const endDate = new Date(this.searchRequest.releaseDate.end).toLocaleDateString();
      const releaseDateTag = `Release Date: ${startDate} - ${endDate}`;
      if (!this.filtersTags.includes(releaseDateTag)) {
        this.filtersTags.push(releaseDateTag);
      }
    }

    // Handle update date
    if (this.searchRequest.updateDate) {
      const startDate = new Date(this.searchRequest.updateDate.start).toLocaleDateString();
      const endDate = new Date(this.searchRequest.updateDate.end).toLocaleDateString();
      const updateDateTag = `Update Date: ${startDate} - ${endDate}`;
      if (!this.filtersTags.includes(updateDateTag)) {
        this.filtersTags.push(updateDateTag);
      }
    }
  }

  /**
   * Handle removal of date range tags
   */
  private handleDateRangeTagRemoval(tagText: string): boolean {
    if (tagText.startsWith('Release Date:')) {
      delete this.searchRequest.releaseDate;
      return true;
    } else if (tagText.startsWith('Update Date:')) {
      delete this.searchRequest.updateDate;
      return true;
    }
    return false;
  }
}
