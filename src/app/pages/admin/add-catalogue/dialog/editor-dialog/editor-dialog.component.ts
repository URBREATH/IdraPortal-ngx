import { Component, Input } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { CodeModel } from '@ngstack/code-editor';

@Component({
  selector: 'ngx-editor-dialog',
  templateUrl: 'editor-dialog.component.html',
  styleUrls: ['editor-dialog.component.scss'],
})
export class EditorDialogComponent {
  
   model: CodeModel = {
      language: 'json',
      uri: 'main.json',
      value: ``,
    };
    
  options = {
    contextmenu: true,
    minimap: {
      enabled: true,
    },
  };

  constructor(protected ref: NbDialogRef<EditorDialogComponent>) {}

  dismiss(mode: boolean) {
    if (mode) 
      this.ref.close(this.model.value);
    else
      return this.ref.close(false);
  } 
}