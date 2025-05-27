import { Component, Input, OnInit } from '@angular/core';
import { DataCataglogueAPIService } from '../data-catalogue/services/data-cataglogue-api.service';
import { CodeModel } from '@ngstack/code-editor';
import { RefreshService } from '../services/refresh.service';

@Component({
  selector: 'ngx-sparql',
  templateUrl: './sparql.component.html',
  styleUrls: ['./sparql.component.scss']
})
export class SparqlComponent implements OnInit {

  constructor(
    private restApi:DataCataglogueAPIService,
    private refreshService: RefreshService,
  ) { }

  model: CodeModel = {
    language: 'json',
    uri: 'main.json',
    value: `PREFIX dc:<http://purl.org/dc/elements/1.1/>
SELECT ?object
WHERE {
  ?subject ?predicate ?object
}
LIMIT 50`,
  };

  @Input() activeTheme = 'vs';
  @Input() readOnly = false;
  @Input() theme = 'vs-light';
  options = {
    contextmenu: true,
    minimap: {
      enabled: true,
    },
  };
  outputFormat: string = 'XML';
  query_bck: string = '';

  clear() {
    this.updateCode('');
  }

  updateCode(value: string) {
    var newData = {
      value: value,
      language: 'json',
      uri: 'main.json',
    };
    this.model = JSON.parse(JSON.stringify(newData));
  }

  executeQuery() {
    let query = this.model.value;
    // query = query.replace(/\n/g, ' ');
    let outputFormat = this.outputFormat;
    this.restApi.executeSPARQLQuery(query, outputFormat).subscribe((data) => {
      if(data?.result != null){
        this.query_bck = query;
        this.updateCode(data.result);
      }
    });
  }

  back() {
    this.updateCode(this.query_bck);
    this.query_bck = '';
  }

  copy() {
    navigator.clipboard.writeText(this.model.value).then(() => {
      console.log('Async: Copying to clipboard was successful!');
    }, (err) => {
      console.error('Async: Could not copy text: ', err);
    });
  }

  download() {
    const blob = new Blob([this.model.value], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sparql-query.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  ngOnInit(): void {
    this.refreshService.refreshPageOnce('admin-configuration');
    this.refreshService.refreshPageOnce('admin-configuration');
  }

}
