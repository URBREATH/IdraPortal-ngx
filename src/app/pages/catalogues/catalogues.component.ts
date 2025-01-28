import { Component, OnInit } from '@angular/core';
import { CataloguesService } from './catalogues.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ngx-catalogues',
  templateUrl: './catalogues.component.html',
  styleUrls: ['./catalogues.component.scss']
})
export class CataloguesComponent implements OnInit {

  constructor(
    private cataloguesService : CataloguesService,
    public translation: TranslateService,
  ) { }

  loadingPrevious = true;
  pageSize = 10;
  startPage = 1;
  catalogues = [];
  error = false;

  ngOnInit(): void {
    this.loadingPrevious = true;
    this.cataloguesService.getCatalogueList().then((data)=>{
      this.catalogues = data.catalogues;
      (this.catalogues).forEach(element => {
        element.lastUpdateDate = new Date(element.lastUpdateDate).toLocaleDateString();
      });
      this.loadingPrevious = false;
    }).
    catch((error)=>{
      this.error = true;
      this.loadingPrevious = false;
    })
  }

}
