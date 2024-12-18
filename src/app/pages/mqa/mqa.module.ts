import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MqaComponent } from './mqa.component';
import { MqaRoutingModule } from './mqa-routing.module';
import { NbButtonModule, NbCardModule, NbIconModule, NbUserModule, NbFormFieldModule, NbInputModule, NbTreeGridModule, NbTableModule, NbAccordionModule, NbToastrModule, NbDialogModule, NbTooltipModule } from '@nebular/theme';
import { NgxEchartsModule } from 'ngx-echarts';
import { FsIconComponent, FsIconComponentCat } from './mqa.component';
import { ThemeModule } from '../../@theme/theme.module';
import { CUSTOM_ELEMENTS_SCHEMA,NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { CustomTranslateLoader } from '../../app.module';
import { HttpClient } from '@angular/common/http';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA,NO_ERRORS_SCHEMA],
  declarations: [MqaComponent, FsIconComponent, FsIconComponentCat],
  imports: [
    MqaRoutingModule,
    CommonModule,
    TranslateModule,
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
    NbToastrModule.forRoot(),
    NbDialogModule.forRoot(),
    NbTooltipModule,
  ]
})
export class MqaModule { }