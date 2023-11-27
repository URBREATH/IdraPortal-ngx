import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatasetComponent } from './dataset/dataset.component';
import { SearchComponent } from './search/search.component';

const routes: Routes = [{
  path: '',
  component: SearchComponent
},
{
  path:':id',
  component: DatasetComponent
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DataCatalogueRoutingModule { }
