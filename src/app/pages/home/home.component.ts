import { Component, OnInit } from '@angular/core';
import { DataCataglogueAPIService } from '../data-catalogue/services/data-cataglogue-api.service';
import { ODMSCatalogueInfo } from '../data-catalogue/model/odmscatalogue-info';
import { SearchRequest } from '../data-catalogue/model/search-request';
import { SearchResult } from '../data-catalogue/model/search-result';
import { randomInt } from 'crypto';
import { Router } from '@angular/router';
import { NbTagComponent, NbTagInputAddEvent } from '@nebular/theme';

@Component({
  selector: 'ngx-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private restApi:DataCataglogueAPIService,
    private router: Router
  ) { }

  cataloguesInfos: Array<ODMSCatalogueInfo>=[]
  totalDatasets:number=0;
  tags: Array<any> = [];
  classes: Array<string> = [];
  searchResponse:SearchResult=new SearchResult();
  searchRequest:SearchRequest=new SearchRequest();

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
    this.restApi.getCataloguesInfo().subscribe(infos =>{
      this.cataloguesInfos = infos;
      this.searchRequest.nodes = infos.map(x=>x.id)
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

  filters: string[] = [];
  
  onTagRemove(tagToRemove: NbTagComponent): void {
    console.log(tagToRemove.text)
    this.filters = this.filters.filter(x => x!=tagToRemove.text);
  }

  onTagAdd({ value, input }: NbTagInputAddEvent): void {
    console.log(value)
    console.log(input)
    //added timeout since comma doesn't desapear from input
    setTimeout(()=>{
      if(input != undefined )
      input.nativeElement.value = ''
      if (value) {
        this.filters.push(value);
      }
      this.router.navigate(['/pages/datasets'], {queryParams:{tags: this.filters.join(',')}})
    }, 50);

    
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

  searchTag(i:any){
    console.log(i)
    let search_parameter = this.tags[i]
    this.router.navigate(['/pages/datasets'], {queryParams:{search_value: search_parameter.search_value, name: this.tags[i].name}})
  }

  searchCategory(category:any){
    this.router.navigate(['/pages/datasets'], {queryParams:category})
  }
}
