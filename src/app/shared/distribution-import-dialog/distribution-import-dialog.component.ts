import { Component, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'ngx-distribution-import-dialog',
  templateUrl: './distribution-import-dialog.component.html',
  styleUrls: ['./distribution-import-dialog.component.scss']
})
export class DistributionImportDialogComponent implements OnInit {
  distributions: any[] = [];
  filteredDistributions: any[] = [];
  selectedDistributions: { [id: string]: boolean } = {};
  searchControl = new FormControl('');
  loading = false;

  constructor(protected dialogRef: NbDialogRef<DistributionImportDialogComponent>) {}

  ngOnInit(): void {
    // Setup search filtering
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.filterDistributions(value);
      });
  }

  filterDistributions(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim() === '') {
      this.filteredDistributions = [...this.distributions];
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    this.filteredDistributions = this.distributions.filter(dist => 
      dist.title.toLowerCase().includes(term) || 
      dist.id.toLowerCase().includes(term) ||
      (dist.description && dist.description.toLowerCase().includes(term))
    );
  }

  toggleDistribution(distribution: any): void {
    this.selectedDistributions[distribution.id] = !this.selectedDistributions[distribution.id];
  }

  isDistributionSelected(distribution: any): boolean {
    return this.selectedDistributions[distribution.id] === true;
  }

// Method to verify if there are selected distributions
  hasSelectedDistributions(): boolean {
    return Object.values(this.selectedDistributions).some(selected => selected === true);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  import(): void {
    const selected = this.distributions.filter(dist => this.selectedDistributions[dist.id]);
    this.dialogRef.close(selected);
  }
}