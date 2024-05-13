import { Component, OnInit } from '@angular/core';
import { DataCataglogueAPIService } from '../data-catalogue/services/data-cataglogue-api.service';
import { ODMSCatalogueInfo } from '../data-catalogue/model/odmscatalogue-info';
import { SearchRequest } from '../data-catalogue/model/search-request';
import { SearchResult } from '../data-catalogue/model/search-result';
import { randomInt } from 'crypto';

@Component({
  selector: 'ngx-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private restApi:DataCataglogueAPIService) { }

  cataloguesInfos: Array<ODMSCatalogueInfo>=[]
  totalDatasets:number=0;
  tags: Array<any> = [];
  searchResponse:SearchResult=new SearchResult();
  searchRequest:SearchRequest=new SearchRequest();

  ngOnInit(): void {
    this.restApi.getCataloguesInfo().subscribe(infos =>{
      this.cataloguesInfos = infos;
      this.searchRequest.nodes = infos.map(x=>x.id)
      this.restApi.searchDatasets(this.searchRequest).subscribe(
        res=>{
            this.totalDatasets = res.count;
            // let tags = res.facets.find(x=>x.displayName=="Tags").values;
            // this.tags = tags.map(x=>{return {name:x.keyword, search_value:x.search_value}});
            // let count = 0;
            // this.tags = this.tags.slice(0,30);
            // let a = document.getElementsByTagName('a');
            // for (let index = 0; index < a.length; index++) {
            //   a[index].setAttribute('data-weight',this.randomNumber(10).toString());
            // }
            // this.tags.forEach(element => {
            //   if(count>=30) return;
            //   count++;
            //   let li = document.createElement('li');
            //   let a = document.createElement('a');
            //   a.innerHTML = element.name;
            //   a.setAttribute('data-weight',this.randomNumber(10).toString());
            //   a.setAttribute('href','#');
            //   // a.onclick = ()=>{this.searchByTag(element.search_value)};
            //   li.appendChild(a);
            //   document.getElementById('tags').appendChild(li);
            // });
        },
        err=>{
          console.log(err);
        });
    },err=>{
      console.log(err);
    })
  }

  randomClass(){
    let classes = ['tag-1','tag-2','tag-3','tag-4','tag-5','tag-6','tag-7','tag-8','tag-9','tag-10']
    return classes[this.randomNumber(9)];
  }

  randomNumber(max:number){
    return Math.floor(Math.random() * max + 1);
  }

}
