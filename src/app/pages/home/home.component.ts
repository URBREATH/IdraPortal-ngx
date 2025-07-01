import { Component, OnInit } from '@angular/core';
import { DataCataglogueAPIService } from '../data-catalogue/services/data-cataglogue-api.service';
import { ODMSCatalogueInfo } from '../data-catalogue/model/odmscatalogue-info';
import { SearchRequest } from '../data-catalogue/model/search-request';
import { SearchResult } from '../data-catalogue/model/search-result';
import { randomInt } from 'crypto';
import { Router } from '@angular/router';
import { NbTagComponent, NbTagInputAddEvent } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { RefreshService } from '../services/refresh.service';

@Component({
  selector: 'ngx-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private restApi:DataCataglogueAPIService,
    private router: Router,
    public translation: TranslateService,
    private refreshService: RefreshService,
  ) { }

  cataloguesInfos: Array<ODMSCatalogueInfo>=[]
  totalDatasets:number=0;
  tags: Array<any> = [];
  classes: Array<string> = [];
  searchResponse:SearchResult=new SearchResult();
  searchRequest:SearchRequest=new SearchRequest();
  advancedSearch:boolean=false;
  searchToggleIcon:string="arrow-ios-downward-outline";
  Filters: Array<any> = [{type: 'ALL', tags: []}];
  selectableOptions: Array<string> = [];
  options: Array<any> = ['description', 'tags', 'title'];

  releasedDate?: [Date, Date];
  updatedDate?: [Date, Date];
  
  catalogueList: Array<any> = [];
  selectedCatalogues: Array<number> = [0];
  selectedCatalogues_prev: Array<number> = [0];
  sourceLanguage: string = "";
  targetsLanguage: Array<string> = [];
  languages: Array<any> = [{"value":"BG" ,"text": "Български" },
    {"value":"ES" ,"text":"Español"},{"value":"CS" ,"text":"Češtина" },
    {"value": "DA" ,"text": "Dansk" },{"value": "DE" ,"text": "Deutsch" },
    {"value": "ET" ,"text": "Eesti" },{"value": "EL" ,"text": "λληνικά"  },
    {"value": "EN" ,"text": "English" },{"value": "FR" ,"text": "Français" },
    {"value": "GA" ,"text": "Gaeilge" },{"value": "HR" ,"text": "Hrvatski" },
    {"value": "IT" ,"text": "Italiano" },{"value": "LV" ,"text": "Latviešu" },{"value": "LT" ,"text": "Lietuvių" },
    {"value": "HU" ,"text": "Magyar" }, {"value": "MT" ,"text": "Malti" },{"value": "NL" ,"text": "Nederlands" },
    {"value": "PL" ,"text": "Polski" },{"value": "PT" ,"text": "Português" },{"value": "RO" ,"text": "Română" },
    {"value": "SK" ,"text": "Slovenčina" },{"value": "SL" ,"text": "Slovenščina" },{"value": "FI" ,"text": "Suomi" },
    {"value": "SV" ,"text": "Svenska" },{"value": "MK" ,"text": "Македонски" },{"value": "SQ" ,"text": "Shqip" },{"value": "SR" ,"text": "Српски" }];

  maxResultPerPage: number = 25;
  sortyBy: number = 4;
  order: number = 0;
  multiLanguageChecked = false;

  toggleMultiLanguage(checked: boolean) {
    this.multiLanguageChecked = checked;
  }

  toggleAdvancedSearch() {
    const card = document.getElementById('advancedSearchCard');
    if (card) {
      card.classList.toggle('visible');
      // Update icon if needed
      this.searchToggleIcon = card.classList.contains('visible') ? 
        'arrow-ios-upward-outline' : 'arrow-ios-downward-outline';
    }
    this.advancedSearch = !this.advancedSearch;
  }

  addFilter(){
    if(this.Filters.length < 4){
      let diff = this.options.filter(x => !this.Filters.map(y=>y.type).includes(x));
      let type = diff[0];
      this.Filters.push({type: type, tags: []});
      this.selectableOptions = diff;
    }
  }

  removeFilter(index:number){
    if(this.Filters.length>1){
      this.Filters.splice(index,1);
      this.selectableOptions = this.options.filter(x => !this.Filters.map(y=>y.type).includes(x));
      this.selectableOptions.push(this.Filters[index-1].type);
    }
  }
  
  onTagRemoveOnFilter(tagToRemove: NbTagComponent, index: number): void {
    this.Filters[index].tags = this.Filters[index].tags.filter(x => x!=tagToRemove.text);
  }

  onTagAddOnFilter({ value, input }: NbTagInputAddEvent, index: number): void {
    if(input != undefined)
      input.nativeElement.value = ''
    if (value) {
      // Check if the last character is a comma and remove it only if it is
      const cleanValue = value.endsWith(',') ? value.substring(0, value.length-1) : value;
      this.Filters[index].tags.push(cleanValue);
    }
  }

  advancedSearchReq(){
    if(!this.advancedSearch){
      // Make sure we're using clean values without any trailing commas
      const cleanTags = this.tagsFilter.map(tag => 
        tag.endsWith(',') ? tag.substring(0, tag.length-1) : tag
      );
      
      console.log("Navigating with tags:", cleanTags);
      
      // Keep using /pages/datasets but ensure tags are properly formatted
      this.router.navigate(['/pages/datasets'], {
        queryParams:{
          tags: cleanTags.join(','),
          advancedSearch: false
        }, 
        queryParamsHandling: 'merge',
      });
    } else {
      let filters = [];
      
      // Add existing text/tag filters
      this.Filters.forEach(filter => {
        if(filter.tags.length > 0){
          filters.push({field: filter.type, value: filter.tags.join(',')});
        }
      });
      
      
      // Build params object
      let params: any = {
        live: false,
        filters: filters,
        sort: {
          field: this.sortyBy ? this.getSortField() : 'title',
          mode: this.order ? 'desc' : 'asc'
        },
        rows: this.maxResultPerPage,
        start: 0,
        nodes: this.getSelectedCatalogues(),
        euroVocFilter: {
          euroVoc: this.multiLanguageChecked,
          sourceLanguage: '',
          targetLanguages: []
        }
      }
      
      // Add dates if they exist
      if (this.releasedDate) {
        params.releaseDate = {
          start: this.releasedDate[0].toISOString(),
          end:   this.releasedDate[1].toISOString(),
        };
      }
      if (this.updatedDate) {
        params.updateDate = {
          start: this.updatedDate[0].toISOString(),
          end:   this.updatedDate[1].toISOString(),
        };
      }
      
      // Multilanguage settings if needed
      if(this.multiLanguageChecked){
        params.euroVocFilter.sourceLanguage = this.sourceLanguage;
        params.euroVocFilter.targetLanguages = this.targetsLanguage;
      }
      
      this.router.navigate(['/pages/datasets'], {
        queryParams: {
          params: JSON.stringify(params),
          advancedSearch: true
        },
        queryParamsHandling: 'merge',
      });
    }
  }

  updateDate(range: { start: Date; end?: Date }, type: number) {
    // only once both ends picked
    if (!range.start || !range.end) return;

    const [s, e] = [range.start, range.end];
    // normalize to UTC midnight (start of day) / end of day
    const startUtc = new Date(Date.UTC(s.getFullYear(), s.getMonth(), s.getDate()));
    const endUtc   = new Date(Date.UTC(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59));

    if (type === 0) {
      this.releasedDate = [startUtc, endUtc];
      this.updatedDate = undefined;
    } else {
      this.updatedDate = [startUtc, endUtc];
      this.releasedDate = undefined;
    }
  }

  handleCataloguesChange(event:any){
    if(event.includes(0) && !this.selectedCatalogues_prev.includes(0)){
      this.selectedCatalogues = this.cataloguesInfos.map(x=>x.id);
      this.selectedCatalogues.unshift(0);
    } else if(!event.includes(0) && this.selectedCatalogues_prev.includes(0)){
      this.selectedCatalogues = [];
    } else if(event.length -1 < this.cataloguesInfos.length && event.includes(0)){
      this.selectedCatalogues = this.selectedCatalogues.filter(x=>x!=0);
    } else if(event.length == this.cataloguesInfos.length && !event.includes(0)){
      this.selectedCatalogues.unshift(0);
    }
    this.selectedCatalogues_prev = this.selectedCatalogues;
  }

	dcatThemes=[{value:"AGRI",icon:"agri",text:"Agriculture"},
		{value:"ECON",icon:"econ",text:"Economy"},
		{value:"EDUC",icon:"educ",text:"Education"},
		{value:"ENER",icon:"ener",text:"Energy"},
		{value:"ENVI",icon:"envi",text:"Environment"},
		{value:"GOVE",icon:"gove",text:"Government"},
		{value:"HEAL",icon:"heal",text:"Health"},
		{value:"INTR",icon:"intr",text:"International"},
		{value:"JUST",icon:"just",text:"Justice"},
		{value:"REGI",icon:"regi",text:"Regions"},
		{value:"SOCI",icon:"soci",text:"Population"},
		{value:"TECH",icon:"tech",text:"Technology"},
		{value:"TRAN",icon:"tran",text:"Transport"}];

    
  ngOnInit(): void {
    this.refreshService.refreshPageOnce('admin-configuration');
    
    this.restApi.getCataloguesInfo().subscribe(infos =>{
      this.cataloguesInfos = infos;
      this.searchRequest.nodes = infos.map(x=>x.id)
      this.selectedCatalogues = infos.map(x=>x.id);
      this.selectedCatalogues.unshift(0);
      this.selectedCatalogues_prev = this.selectedCatalogues;
      this.restApi.searchDatasets(this.searchRequest).subscribe(
        res=>{
            this.totalDatasets = res.count;
            let tags = res.facets.find(x=>x.displayName=="Tags").values;
            tags = tags.map(x=>{return {name:x.keyword, search_value:x.search_value}})
            // shuffle tags
            for(let i=tags.length-1; i>0; i--){
              const j = Math.floor(Math.random() * i)
              const temp = tags[i]
              tags[i] = tags[j]
              tags[j] = temp
            }
            this.tags = tags.slice(0,30);
            this.classes = this.tags.map(x=>this.randomClass());
        },
        err=>{
          console.log(err);
        });
    },err=>{
      console.log(err);
    })
  }

  tagsFilter: string[] = [];
  
  onTagRemove(tagToRemove: NbTagComponent): void {
    this.tagsFilter = this.tagsFilter.filter(x => x!=tagToRemove.text);
  }

  tagInputKeydown(event: KeyboardEvent): void {
    // Don't do anything on Enter - we'll handle it in the keyup.enter event
    if (event.key === 'Enter') {
      return;
    }
    
    // Handle comma separator
    if ((event.target as HTMLInputElement).value.endsWith(',')) {
      const value = (event.target as HTMLInputElement).value.slice(0, -1).trim();
      if (value) {
        this.tagsFilter.push(value);
        (event.target as HTMLInputElement).value = '';
      }
    }
  }

  tagInputKeydownFilters(event: KeyboardEvent, i: number): void {
    // Only handle comma here - Enter will be handled by (keyup.enter)
    if ((event.target as HTMLInputElement).value.endsWith(',')) {
      const value = (event.target as HTMLInputElement).value.slice(0, -1).trim();
      if (value) {
        this.Filters[i].tags.push(value);
        (event.target as HTMLInputElement).value = '';
      }
    }
  }

  onTagAdd({ value, input }: NbTagInputAddEvent): void {
    if(input != undefined)
    input.nativeElement.value = '';
    
  if (value) {
    // Clean the value properly - remove commas at the end
    const cleanValue = value.endsWith(',') ? value.substring(0, value.length-1) : value;
    
    // Only add if it's not empty after cleaning
    if (cleanValue.trim() !== '') {
      this.tagsFilter.push(cleanValue);
      console.log("Added tag:", cleanValue, "Tags now:", this.tagsFilter);
    }
  }
  }

  addCurrentInputAndSearch(inputElement: HTMLInputElement): void {
    // Get the current input value
    const currentValue = inputElement.value.trim();
    
    // Add it to tags if not empty
    if (currentValue) {
      this.tagsFilter.push(currentValue);
      inputElement.value = ''; // Clear the input
    }
    
    // Now perform the search with the updated tags
    console.log("Search with tags:", this.tagsFilter);
    this.advancedSearchReq();
  }

  // Add this method to capture current inputs in advanced search
  addCurrentFilterInputsAndSearch(): void {
    if (this.advancedSearch) {
      // Get all advanced search filter inputs
      const filterInputs = document.querySelectorAll('.filter-input');
      
      // Process each filter input
      filterInputs.forEach((input: HTMLInputElement, index) => {
        const value = input.value.trim();
        if (value && index < this.Filters.length) {
          // Add the current input value to the filter's tags array
          this.Filters[index].tags.push(value);
          input.value = ''; // Clear the input
        }
      });
    }

    console.log("Filters after adding current inputs:", this.Filters);
    
    // Now perform the search with all inputs captured
    this.advancedSearchReq();
  }

  randomClass(){
    let classes = ['tag-1','tag-2','tag-3','tag-4','tag-5','tag-6','tag-7']
    return classes[this.randomNumber(classes.length-1)];
  }

  randomNumber(max:number){
    return Math.floor(Math.random() * max + 1);
  }

  getClass(index:number){
    return this.classes[index];
  }

  searchTag(i:number){
    let search_parameter = this.tags[i]
    this.router.navigate(['/pages/datasets'], {queryParams:{search_value: search_parameter.search_value, name: this.tags[i].name}, queryParamsHandling: 'merge'})
  }

  searchCategory(category:any){
    this.router.navigate(['/pages/datasets'], {queryParams:category, queryParamsHandling: 'merge'})
  }

  // Add this method to get the sort field based on your sortyBy property
  private getSortField(): string {
    // Assuming sortyBy is a string or number that maps to field names
    // Modify this mapping based on your actual data model
    const sortFieldMap = {
      0: 'title',
      1: 'description',
      2: 'releaseDate',
      3: 'updateDate'
      // Add other mappings as needed
    };
    
    // Return the mapped field or default to 'title'
    return sortFieldMap[this.sortyBy] || 'title';
  }

  // Add this method to get the selected catalogues
  private getSelectedCatalogues(): number[] {
    // If "All" (typically ID 0) is selected, return all catalogue IDs except 0
    if (this.selectedCatalogues.includes(0)) {
      return this.selectedCatalogues.filter(id => id !== 0);
    }
    
    // Otherwise return the currently selected catalogues
    return this.selectedCatalogues;
  }

  /**
 * Clears a specific date range
 * @param type 0 for released date, 1 for updated date
 */
clearDateRange(type: number): void {
  if (type === 0) {
    this.releasedDate = undefined;
  } else {
    this.updatedDate = undefined;
  }
}

/**
 * Gets the display string for released date range if set
 */
getReleasedDateDisplay(): string {
  if (!this.releasedDate) return '';
  return this.formatDateRange(this.releasedDate);
}

/**
 * Gets the display string for updated date range if set
 */
getUpdatedDateDisplay(): string {
  if (!this.updatedDate) return '';
  return this.formatDateRange(this.updatedDate);
}

/**
 * Formats a date range for display
 */
private formatDateRange(dateRange: [Date, Date]): string {
  if (!dateRange || !dateRange[0] || !dateRange[1]) return '';
  
  const start = dateRange[0].toLocaleDateString();
  const end = dateRange[1].toLocaleDateString();
  return `${start} - ${end}`;
}
}
