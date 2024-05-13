import { Component, OnInit } from '@angular/core';
import { DataCataglogueAPIService } from '../data-catalogue/services/data-cataglogue-api.service';
import { ODMSCatalogueInfo } from '../data-catalogue/model/odmscatalogue-info';
import { SearchRequest } from '../data-catalogue/model/search-request';
import { SearchResult } from '../data-catalogue/model/search-result';
import { randomInt } from 'crypto';
import { Router } from '@angular/router';

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
}
