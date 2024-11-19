import { Component, Input, OnInit } from '@angular/core';
import { DataCataglogueAPIService } from '../data-catalogue/services/data-cataglogue-api.service';
import { Router } from '@angular/router';
import { CodeModel } from '@ngstack/code-editor';

@Component({
  selector: 'ngx-sparql',
  templateUrl: './sparql.component.html',
  styleUrls: ['./sparql.component.scss']
})
export class SparqlComponent implements OnInit {

  constructor(
    private restApi:DataCataglogueAPIService,
    private router: Router
  ) { }

  @Input() activeTheme = 'vs';
  @Input() readOnly = false;
  @Input()
  code = [
    `PREFIX dc:<http://purl.org/dc/elements/1.1/>`,
    `SELECT ?object`,
    `WHERE {`,
    `?subject ?predicate ?object`,
    `}`,
    'LIMIT 50'
  ].join('\n');

  dependencies: string[] = [
    '@types/node',
    '@ngstack/translate', 
    '@ngstack/code-editor'
  ];

  options = {
    contextmenu: true,
    minimap: {
      enabled: true
    }
  };

  onCodeChanged(value) {
    console.log('CODE', value);
  }
  outputFormat: string = 'XML';


  clear() {
    this.code = '';
  }

  executeQuery() {
    let query = this.code;
    let outputFormat = this.outputFormat;
    this.restApi.executeSPARQLQuery(query, outputFormat).subscribe((data: {}) => {
      console.log(data);
    });
  }

  ngOnInit(): void {
  }

}
