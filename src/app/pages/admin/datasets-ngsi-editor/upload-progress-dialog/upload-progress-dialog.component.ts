import { Component, Input } from '@angular/core';

interface UploadQueueItem {
  id: string;
  name: string;
  progress: number;
  status: string;
}

@Component({
  selector: 'ngx-upload-progress-dialog',
  templateUrl: './upload-progress-dialog.component.html',
  styleUrls: ['./upload-progress-dialog.component.scss'],
})
export class UploadProgressDialogComponent {
  @Input() items: UploadQueueItem[] = [];
}
