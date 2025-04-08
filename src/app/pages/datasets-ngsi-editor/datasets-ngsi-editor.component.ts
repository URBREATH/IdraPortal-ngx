import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { NgsiDatasetsService } from '../services/ngsi-datasets.service';
import { Router } from '@angular/router';
import moment from 'moment';
import { NbDialogService } from '@nebular/theme';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';

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
  
  loadingDistributions: boolean = false;

  deletingDistributions: { [key: string]: boolean } = {};

  selectedDistributions: {[id: string]: boolean} = {};

  constructor(
        private fb: FormBuilder,
        private ngsiDatasetsService: NgsiDatasetsService,
        private router: Router,
        private dialogService: NbDialogService 
  ) { }

  ngOnInit(): void {
    // Initialize distribution form
    this.distributionForm = this.fb.group({
      id: [''],
      title: ['', Validators.required],
      format: ['text/csv'], // Added missing control
      description: [''],
      accessUrl: [''],
      downloadURL: ['', Validators.required], 
      byteSize: [0],
      checksum: [''],
      rights: [''],
      mediaType: [''],
      license: ['CC-BY'],
      releaseDate: [''],
      modifiedDate: ['']
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
    
    // Load distributions automatically
    this.loadDistributions();
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

  createDistribution(): void {
    // Mark all fields as touched to trigger validation display
    this.markFormGroupTouched(this.distributionForm);
    
    if (this.distributionForm.invalid) {
      console.error('Form is invalid. Please fill in required fields.');
      return;
    }

    const formData = this.distributionForm.value;

    // Format the distribution object according to API requirements
    const distribution = {
      id: formData.id || this.generateDistributionId(),
      title: formData.title,
      description: formData.description || 'Distribution description',
      accessUrl: [formData.accessUrl || ''],
      downloadURL: formData.downloadURL || `urn:ngsi-ld:DistributionDCAT-AP:items:${this.generateRandomId()}`,
      format: formData.format || 'text/csv',
      byteSize: formData.byteSize || Math.floor(Math.random() * 100000),
      checksum: formData.checksum || this.generateRandomChecksum(),
      rights: formData.rights || 'copyleft',
      mediaType: formData.mediaType || '',
      license: formData.license || 'CC-BY',
      releaseDate: formData.releaseDate ? 
        new Date(formData.releaseDate).toISOString() : 
        new Date().toISOString(),
      modifiedDate: formData.modifiedDate ? 
        new Date(formData.modifiedDate).toISOString() : 
        new Date().toISOString()
    };

    this.ngsiDatasetsService.createDistribution(distribution).subscribe({
      next: (response) => {
        console.log('Distribution created successfully:', response);
        
        // Add the created distribution to local array
        this.distributions.push(distribution);
        
        // Reset the form
        this.distributionForm.reset({
          format: 'text/csv',
          license: 'CC-BY',
          rights: 'copyleft'
        });
      },
      error: (error) => {
        console.error('Error creating distribution:', error);
      }
    });
  }

  generateDistributionId(): string {
    // Simple ID generator
    const prefix = 'DIST';
    const randomNum = Math.floor(Math.random() * 100000000);
    return `${prefix}:${randomNum}`;
  }

  removeDistribution(index: number): void {
    const distributionToDelete = this.distributions[index];
    
    if (!distributionToDelete || !distributionToDelete.id) {
      console.error('Invalid distribution or missing ID');
      return;
    }
    
    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Delete Distribution',
        message: `Are you sure you want to delete distribution "${distributionToDelete.title}"?`,
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        // Set loading state for this specific distribution
        this.deletingDistributions[distributionToDelete.id] = true;
        
        this.ngsiDatasetsService.deleteDistribution(distributionToDelete.id).subscribe({
          next: () => {
            console.log(`Distribution ${distributionToDelete.id} deleted successfully`);
            this.distributions.splice(index, 1);
            delete this.deletingDistributions[distributionToDelete.id];
          },
          error: (error) => {
            console.error(`Error deleting distribution ${distributionToDelete.id}:`, error);
            delete this.deletingDistributions[distributionToDelete.id];
            // You can also use a toast service here instead of alert
            alert(`Failed to delete distribution: ${error.message || 'Unknown error'}`);
          }
        });
      }
    });
  }

  onImportDistributions(): void {
    this.loadingDistributions = true;
    
    this.ngsiDatasetsService.getDistributions().subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          // Filter out distributions that are already in the list (avoid duplicates)
          const newDistributions = response.filter(newDist => 
            !this.distributions.some(existingDist => existingDist.id === newDist.id)
          );
          
          // Add the new distributions to the existing array
          if (newDistributions.length > 0) {
            this.distributions = [...this.distributions, ...newDistributions];
            console.log(`Imported ${newDistributions.length} new distributions`);
          } else {
            console.log('No new distributions to import');
          }
        } else {
          console.log('No distributions available to import');
        }
        
        this.loadingDistributions = false;
      },
      error: (error) => {
        console.error('Error loading distributions:', error);
        this.loadingDistributions = false;
      }
    });
  }

  onCreateDataset(): void {
    // Format the data according to the required structure
    const formValue = this.datasetForm.value;
    
    // Get distribution IDs for the datasetDistribution field - only include checked distributions
    const datasetDistribution = this.distributions
      .filter(dist => this.selectedDistributions[dist.id])
      .map(dist => dist.id);

    // Format date with time component
    const releaseDate = formValue.releaseDate ? 
      new Date(formValue.releaseDate).toISOString() : 
      new Date().toISOString();

    // Create the final dataset object
    const dataset = {
      ...formValue,
      releaseDate,
      datasetDistribution, // This now contains only selected distributions
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
    
    this.ngsiDatasetsService.createDataset(dataset).subscribe({
      next: (response) => {
        console.log('Dataset created successfully:', response);
        this.datasetForm.reset();
        this.distributions = [];
        this.selectedDistributions = {};
        this.router.navigate(['/pages/datasets-ngsi']);
      },
      error: (error) => {
        console.error('Error creating dataset:', error);
      }
    });
  }

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

  loadDistributions(): void {
    this.loadingDistributions = true;
    
    this.ngsiDatasetsService.getDistributions().subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.distributions = response;
          
          // Select all distributions by default
          response.forEach(dist => {
            this.selectedDistributions[dist.id] = true;
          });
          
          console.log(`Loaded ${this.distributions.length} distributions`);
        } else {
          console.log('No distributions available');
        }
        this.loadingDistributions = false;
      },
      error: (error) => {
        console.error('Error loading distributions:', error);
        this.loadingDistributions = false;
      }
    });
  }

  // Check if all distributions are selected
  areAllDistributionsSelected(): boolean {
    return this.distributions.length > 0 && 
           this.distributions.every(dist => this.selectedDistributions[dist.id]);
  }

  // Toggle selection for all distributions
  toggleAllDistributions(checked: boolean): void {
    if (checked) {
      this.distributions.forEach(dist => {
        this.selectedDistributions[dist.id] = true;
      });
    } else {
      this.selectedDistributions = {};
    }
  }

  private generateRandomId(): string {
    return `${Math.floor(Math.random() * 10000)}:${Math.floor(Math.random() * 100000000)}`;
  }

  private generateRandomChecksum(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result + '.';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.distributionForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
