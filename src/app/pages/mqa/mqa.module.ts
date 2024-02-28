import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MqaComponent } from './mqa.component';
import { MqaRoutingModule } from './mqa-routing.module';
import { NbButtonModule, NbCardModule, NbIconModule, NbUserModule, NbFormFieldModule, NbInputModule, NbTreeGridModule, NbTableModule, NbAccordionModule, NbToastrModule, NbDialogModule } from '@nebular/theme';
import { NgxEchartsModule } from 'ngx-echarts';
import { FsIconComponent, FsIconComponentCat } from './mqa.component';
import { ThemeModule } from '../../@theme/theme.module';
import { Ng2SmartTableModule } from 'ng2-smart-table';

@NgModule({
  declarations: [MqaComponent, FsIconComponent, FsIconComponentCat],
  imports: [
    MqaRoutingModule,
    CommonModule,
    NbCardModule,
    NbButtonModule,
    NbIconModule,
    NbUserModule,
    NbFormFieldModule,
    NbInputModule,
    NbAccordionModule,
    NgxEchartsModule,
    NbTreeGridModule,
    NbTableModule,
    ThemeModule,
    Ng2SmartTableModule,
    NbToastrModule.forRoot(),
    NbDialogModule.forRoot()
  ]
})
export class MqaModule { }