import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { NgsiDatasetsService } from '../services/ngsi-datasets.service';
import { Router } from '@angular/router';
import moment from 'moment';;

@Component({
  selector: 'app-datasets-ngsi-editor',
  templateUrl: './datasets-ngsi-editor.component.html',
  styleUrls: ['./datasets-ngsi-editor.component.scss']
})
export class DatasetsNgsiEditorComponent implements OnInit {

  selectedStepIndex = 0;
  
  distributionForm: FormGroup;
  distributions: any[] = [];
  
  datasetForm: FormGroup;
  
  constructor(
        private fb: FormBuilder,
        private ngsiDatasetsService: NgsiDatasetsService,
        private router: Router
  ) { }

  ngOnInit(): void {
    // Initialize distribution form
    this.distributionForm = this.fb.group({
      id: [''],
      title: [''],
      downloadUrl: [''],
      format: ['CSV'],
      releaseDate: [''],
      description: [''],
    });

    // Initialize dataset form with arrays for multi-value fields
    this.datasetForm = this.fb.group({
      id: [''],
      title: [''],
      datasetDescription: this.fb.array([this.createDescriptionField()]),
      description: [''],
      name: [''],
      publisher: [''],
      spatial: this.fb.array([]),
      releaseDate: [''],
      theme: this.fb.array([this.createThemeField()]),
      contactPoint: this.fb.array([this.createContactPointField()]),
      creator: [''],
      keyword: this.fb.array([this.createKeywordField()]),
      accessRights: ['non-public'],
      frequency: [''],
      version: [''],
      versionNotes: this.fb.array([this.createVersionNoteField()])
    });

    // Add initial spatial point
    this.addSpatialPoint();
  }

  // Helper methods for form arrays
  createDescriptionField() {
    return this.fb.control('');
  }

  createThemeField() {
    return this.fb.control('');
  }

  createContactPointField() {
    return this.fb.control('');
  }

  createKeywordField() {
    return this.fb.control('');
  }

  createVersionNoteField() {
    return this.fb.control('');
  }

  createSpatialPoint() {
    return this.fb.group({
      type: ['Point'],
      coordinates: this.fb.array([
        this.fb.control(this.getRandomCoordinate(0, 180)), // longitude
        this.fb.control(this.getRandomCoordinate(-90, 90)) // latitude
      ])
    });
  }

  // Helper to generate realistic coordinates
  getRandomCoordinate(min: number, max: number): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(6));
  }

  // Form array getters
  get datasetDescriptions() {
    return this.datasetForm.get('datasetDescription') as FormArray;
  }

  get themes() {
    return this.datasetForm.get('theme') as FormArray;
  }

  get contactPoints() {
    return this.datasetForm.get('contactPoint') as FormArray;
  }

  get keywords() {
    return this.datasetForm.get('keyword') as FormArray;
  }

  get versionNotesArray() {
    return this.datasetForm.get('versionNotes') as FormArray;
  }

  get spatialPoints() {
    return this.datasetForm.get('spatial') as FormArray;
  }

  // Methods to add new items to arrays
  addDatasetDescription() {
    this.datasetDescriptions.push(this.createDescriptionField());
  }

  addTheme() {
    this.themes.push(this.createThemeField());
  }

  addContactPoint() {
    this.contactPoints.push(this.createContactPointField());
  }

  addKeyword() {
    this.keywords.push(this.createKeywordField());
  }

  addVersionNote() {
    this.versionNotesArray.push(this.createVersionNoteField());
  }

  addSpatialPoint() {
    this.spatialPoints.push(this.createSpatialPoint());
  }

  // Methods to remove items from arrays
  removeDatasetDescription(index: number) {
    this.datasetDescriptions.removeAt(index);
  }

  removeTheme(index: number) {
    this.themes.removeAt(index);
  }

  removeContactPoint(index: number) {
    this.contactPoints.removeAt(index);
  }

  removeKeyword(index: number) {
    this.keywords.removeAt(index);
  }

  removeVersionNote(index: number) {
    this.versionNotesArray.removeAt(index);
  }

  removeSpatialPoint(index: number) {
    this.spatialPoints.removeAt(index);
  }

  onAddDistribution(): void {
    // Ensure the distribution has an ID
    const distribution = {
      ...this.distributionForm.value,
      id: this.distributionForm.value.id || this.generateDistributionId()
    };
    
    this.distributions.push(distribution);
    
    this.distributionForm.reset({
      format: 'CSV',
    });
  }

  generateDistributionId(): string {
    // Simple ID generator
    const prefix = 'DIST';
    const randomNum = Math.floor(Math.random() * 100000000);
    return `${prefix}:${randomNum}`;
  }

  removeDistribution(index: number): void {
    this.distributions.splice(index, 1);
  }

  onImportDistributions(): void {
    console.log('Importing distributions...');
  }

  onCreateDataset(): void {
    // Format the data according to the required structure
    const formValue = this.datasetForm.value;
    
    // Get distribution IDs for the datasetDistribution field
    const datasetDistribution = this.distributions.map(dist => dist.id);

    // Format date with time component
    const releaseDate = formValue.releaseDate ? 
      new Date(formValue.releaseDate).toISOString() : 
      new Date().toISOString();

    // Create the final dataset object
    const dataset = {
      ...formValue,
      releaseDate,
      datasetDistribution,
      // Ensure these are arrays even if empty
      datasetDescription: formValue.datasetDescription || [],
      theme: formValue.theme || [],
      contactPoint: formValue.contactPoint || [],
      keyword: formValue.keyword || [],
      versionNotes: formValue.versionNotes || [],
      // Ensure spatial has proper coordinates
      spatial: formValue.spatial?.length > 0 ? formValue.spatial : [{
        type: "Point",
        coordinates: [
          parseFloat((Math.random() * 180).toFixed(6)),
          parseFloat((Math.random() * 90).toFixed(6))
        ]
      }]
    };
    
    console.log('Creating dataset with data:', JSON.stringify(dataset));
    
    this.ngsiDatasetsService.postDataset(dataset).subscribe({
      next: (response) => {
        console.log('Dataset created successfully:', response);
        this.datasetForm.reset();
        this.distributions = [];
        this.router.navigate(['/pages/datasets-ngsi']);
      },
      error: (error) => {
        console.error('Error creating dataset:', error);
      }
    });
  }

  // Add this method to handle date selection
  onDateSelect(date: Date, controlName: string) {
    if (date) {
      const formattedDate = moment(date).format('YYYY-MM-DD');
      if (controlName === 'releaseDate') {
        this.distributionForm.get('releaseDate')?.setValue(formattedDate);
      } else if (controlName === 'datasetReleaseDate') {
        this.datasetForm.get('releaseDate')?.setValue(formattedDate);
      }
    }
  }
}
