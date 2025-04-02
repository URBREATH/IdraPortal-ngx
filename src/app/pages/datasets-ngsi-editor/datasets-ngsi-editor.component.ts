import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-datasets-ngsi-editor',
  templateUrl: './datasets-ngsi-editor.component.html',
  styleUrls: ['./datasets-ngsi-editor.component.scss']
})
export class DatasetsNgsiEditorComponent implements OnInit {

  selectedStepIndex = 0; // Tracks which step is active
  
  distributionForm: FormGroup;
  distributions: any[] = []; // Storage for distribution items
  
  datasetForm: FormGroup;
  
  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // Initialize form groups
    this.distributionForm = this.fb.group({
      title: [''],
      downloadUrl: [''],
      format: ['CSV'],
      releaseDate: [''],
      description: [''],
    });

    this.datasetForm = this.fb.group({
      title: [''],
      downloadUrl: [''],
      format: ['CSV'],
      releaseDate: [''],
      description: [''],
      versionNotes: [''],
      name: [''],
      publisher: [''],
      contactPoint: [''],
      creator: [''],
      keyword: [''],
      theme: [''],
      access: ['PUBLIC'],
      frequency: ['WEEKLY'],
      // etc.
    });
  }

  onAddDistribution(): void {
    // Add distribution to array for display on the right
    this.distributions.push(this.distributionForm.value);
    // Clear (or reset) the form
    this.distributionForm.reset({
      format: 'CSV',
    });
  }

  removeDistribution(index: number): void {
    this.distributions.splice(index, 1);
  }

  onImportDistributions(): void {
    // Logic for "Import" could go here
    console.log('Importing distributions...');
  }

  onCreateDataset(): void {
    // Collect final data from forms
    const dataset = {
      ...this.datasetForm.value,
      distributions: this.distributions,
    };
    
    console.log('Creating dataset with data:', dataset);
    // Call your backend service or NGSI service to persist the dataset
  }
}
