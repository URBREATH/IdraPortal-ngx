import { Component, Input, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import {
  MinioBrowseEntry,
  MinioBrowseService,
} from '../../../services/minio-browse.service';

@Component({
  selector: 'ngx-minio-browser-dialog',
  templateUrl: './minio-browser-dialog.component.html',
  styleUrls: ['./minio-browser-dialog.component.scss']
})
export class MinioBrowserDialogComponent implements OnInit {
  @Input() selectedKey: string | null = null;

  entries: MinioBrowseEntry[] = [];
  error: string | null = null;
  loading: boolean = false;
  currentPrefix: string = '';

  constructor(
    private dialogRef: NbDialogRef<MinioBrowserDialogComponent>,
    private minioBrowseService: MinioBrowseService,
  ) {}

  ngOnInit(): void {
    this.loadEntries('');
  }

  onEntryClick(entry: MinioBrowseEntry): void {
    if (entry.type === 'folder') {
      this.loadEntries(entry.key);
      return;
    }
    this.selectObject(entry.key);
  }

  goUp(): void {
    if (!this.currentPrefix) {
      return;
    }
    const trimmed = this.currentPrefix.endsWith('/')
      ? this.currentPrefix.slice(0, -1)
      : this.currentPrefix;
    const lastSlash = trimmed.lastIndexOf('/');
    const parentPrefix = lastSlash === -1 ? '' : trimmed.slice(0, lastSlash + 1);
    this.loadEntries(parentPrefix);
  }

  displayName(entry: MinioBrowseEntry): string {
    const rawName = entry.key.startsWith(this.currentPrefix)
      ? entry.key.slice(this.currentPrefix.length)
      : entry.key;
    const cleaned = entry.type === 'folder' ? rawName.replace(/\/$/, '') : rawName;
    return cleaned || entry.key;
  }

  close(): void {
    this.dialogRef.close();
  }

  private selectObject(objectKey: string): void {
    this.dialogRef.close(objectKey);
  }

  private loadEntries(prefix: string): void {
    this.loading = true;
    this.error = null;

    this.minioBrowseService.listEntries(prefix).subscribe({
      next: (entries) => {
        this.entries = entries ?? [];
        this.currentPrefix = prefix;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.entries = [];
        this.error = 'Unable to load objects from MinIO.';
        console.error('MinIO list failed:', error);
      },
    });
  }
}
