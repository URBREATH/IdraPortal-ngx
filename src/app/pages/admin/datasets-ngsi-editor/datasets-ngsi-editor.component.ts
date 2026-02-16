import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { NgsiDatasetsService } from '../../services/ngsi-datasets.service';
import { Router } from '@angular/router';
import moment from 'moment';
import { NbDialogRef, NbDialogService, NbToastrService } from '@nebular/theme';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import * as L from 'leaflet';
import { MapDialogComponent } from '../../../shared/map-dialog/map-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { MinioBrowseService } from '../../services/minio-browse.service';
import { MinioUploadService } from '../../services/minio-upload.service';
import { MinioBrowserDialogComponent } from './minio-browser-dialog/minio-browser-dialog.component';
import { UploadProgressDialogComponent } from './upload-progress-dialog/upload-progress-dialog.component';
import { from, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

interface LicenseOption {
  value: string;
  label: string;
}

interface PendingUpload {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  savedAt: string;
}

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

interface UploadQueueItem {
  id: string;
  name: string;
  progress: number;
  status: UploadStatus;
}

@Component({
  selector: 'app-datasets-ngsi-editor',
  templateUrl: './datasets-ngsi-editor.component.html',
  styleUrls: ['./datasets-ngsi-editor.component.scss']
})
export class DatasetsNgsiEditorComponent implements OnInit {
  private readonly pendingUploadStorageKey = 'pending_minio_uploads';
  pendingUploadId: string | null = null;
  private pendingFileCache = new Map<string, File>();
  uploadQueue: UploadQueueItem[] = [];
  private uploadProgressDialogRef?: NbDialogRef<UploadProgressDialogComponent>;

  formatOptions: string[] = [
    'JSON',
    'CSV',
    'XML',
    'TXT',
    'XLSX',
    'PDF',
    'GeoJSON',
    'WMS',
    'Other'
  ];

  // Add this property to track if "Other" format is selected
  isOtherFormatSelected: boolean = false;
  licenseOptions: LicenseOption[] = [];
  readonly otherLicenseValue = '__other__';
  isOtherLicenseSelected: boolean = false;
  selectedUploadFile: File | null = null;
  isUploadingFile: boolean = false;
  uploadErrorMessage: string | null = null;
  uploadedPublicUrl: string | null = null;
  selectedMinioObjectKey: string | null = null;
  isListingMinioObjects: boolean = false;

  selectedStepIndex = 0;
  
  distributionForm: FormGroup;
  distributions: any[] = [];
  
  datasetForm: FormGroup;
  
  loadingDistributions: boolean = false;

  deletingDistributions: { [key: string]: boolean } = {};

  isEditing: boolean = false;

  public map: L.Map;

  isEditingDistribution: boolean = false;
  currentEditingDistributionId: string = null;

  isCreatingDataset: boolean = false;
  pendingDistributions: any[] = [];

  distributionsToDelete: string[] = []; // Array of distribution IDs to delete

  existingDatasetIds: string[] = []; // Array to store existing dataset IDs

  // Array to store the keywords
  keywordArray: string[] = [];

  // Array to store the contact points
  contactPointArray: string[] = [];

  constructor(
        private fb: FormBuilder,
        private ngsiDatasetsService: NgsiDatasetsService,
        private router: Router,
        private dialogService: NbDialogService,
        private toastrService: NbToastrService,
        public translation: TranslateService,
        private http: HttpClient,
        private minioUploadService: MinioUploadService,
        private minioBrowseService: MinioBrowseService
  ) { }

  ngOnInit(): void {

    // Initialize form
    this.initForms();
    this.loadLicenseOptions();
    
    // Load existing dataset IDs for validation
    this.loadExistingDatasetIds();
    
    // Check if we're editing an existing dataset
    const storedDataset = localStorage.getItem('dataset_to_edit');
    if (storedDataset) {
      try {
        const parsedDataset = JSON.parse(storedDataset);
        this.isEditing = true; // Set editing flag to true
        
        // Populate the form with existing data
        this.populateDatasetForm(parsedDataset);
        
        // Load only distributions associated with this dataset
        this.loadDistributionsForDataset(parsedDataset);
      } catch (error) {
        console.error('Error parsing dataset from localStorage:', error);
        this.isEditing = false;
        // Start with an empty distributions list for new datasets
        this.distributions = [];
      }
    } else {
      this.isEditing = false;
      // Start with an empty distributions list for new datasets
      this.distributions = [];
    }
  }

  //open street map tiles
  osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> | &copy; <a href='https://www.flaticon.com/authors/smashingstocks'>smashingstocks - Flaticon</a>",
  });

  // Add this method to handle stepper step changes
  onStepChange(stepperIndex: number): void {
    if (stepperIndex === 1 && !this.hasActiveDistributions()) {
      this.selectedStepIndex = 0;
      this.showStepTwoBlockedWarning();
      return;
    }

    // Check if we're leaving step 2 (index 1) and clean up the map
    if (this.selectedStepIndex === 1 && stepperIndex !== 1) {
      this.cleanupMap();
    }    

    this.selectedStepIndex = stepperIndex;
    
    // Call initMap specifically when we reach step 2 (index 1)
    if (this.selectedStepIndex === 1) {
      // Use setTimeout to ensure the DOM is ready with the map element
      setTimeout(() => {
        this.initMap();
      });
    }
  }

  goToDatasetStep(stepper: { next: () => void }): void {
    if (!this.hasActiveDistributions()) {
      this.showStepTwoBlockedWarning();
      return;
    }
    stepper.next();
  }

  hasActiveDistributions(): boolean {
    return this.distributions.some(dist => !dist.markedForDeletion);
  }

  private showStepTwoBlockedWarning(): void {
    this.toastrService.warning(
      this.translation.instant('DIALOG_NO_ACTIVE_DISTRIBUTIONS'),
      this.translation.instant('DIALOG_CANNOT_PROCEED')
    );
  }

  // Method to properly clean up the map
  private cleanupMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // Update initMap to handle null spatial data
  private initMap(): void {

    // Fix marker icon issue by setting the default icon using CDN URLs
    const iconDefault = L.icon({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    
    // Assign the default icon to L.Marker.prototype
    L.Marker.prototype.options.icon = iconDefault;

    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.log('Map element not found. Cannot initialize map.');
      return;
    }
    
    // Initialize the map with OpenStreetMap tiles
    this.map = L.map("map", {
      center: [52, 12],
      zoom: 3,
      layers: [this.osm],
    });

    //Open the map dialog when clicking on the map
    this.map.on('click', () => {
      this.openMapDialog();
    });

    // Create a FeatureGroup to hold the spatial entity
    const geometry = new L.FeatureGroup();
    
    // Check if we have spatial data in localStorage
    const storedDataset = localStorage.getItem('dataset_to_edit');
    if (storedDataset !== null) {
      const parsedData = JSON.parse(storedDataset);
      let spatial = parsedData.spatial;
      
      // Only add to map if spatial data exists
      if (spatial) {
        // Handle different geometry types
        if (spatial.type === 'Point') {
          // Create a marker for Point geometry
          const [longitude, latitude] = spatial.coordinates;
          L.marker([latitude, longitude])
            .bindPopup(`Point: [${latitude}, ${longitude}]`)
            .addTo(geometry);
        } 
        else if (spatial.type === 'LineString') {
          // Create a polyline for LineString geometry
          const latLngs = spatial.coordinates.map(coord => [coord[1], coord[0]]);
          L.polyline(latLngs, { color: 'blue' })
            .bindPopup('LineString')
            .addTo(geometry);
        }
        else if (spatial.type === 'Polygon') {
          // Create a polygon for Polygon geometry
          const latLngs = spatial.coordinates[0].map(coord => [coord[1], coord[0]]);
          L.polygon(latLngs, { color: 'green' })
            .bindPopup('Polygon')
            .addTo(geometry);
        }
        
        // Add the FeatureGroup to the map
        geometry.addTo(this.map);
        
        // Fit the map to the bounds of the geometry
        if (geometry.getLayers().length > 0) {
          this.map.fitBounds(geometry.getBounds(), {
            padding: [50, 50],
            maxZoom: 5
          });
        }
      }
    }
  }

  // Initialize forms
  initForms(): void {
    // Add validator to distribution form
    this.distributionForm = this.fb.group({
      id: ['', [this.forbiddenCharsValidator()]],  // Apply validator
      title: ['', Validators.required],
      format: ['CSV'],
      description: [''],
      accessUrl: [''],
      resourceType: [null, Validators.required],
      downloadURL: [''], 
      uploadFile: [null],
      byteSize: [0],
      checksum: [''],
      rights: [''],
      mediaType: [''],
      license: [null],
      licenseOther: [''],
      releaseDate: [''],
      modifiedDate: ['']
    });

    // Monitor format changes to toggle otherFormat field
    this.distributionForm.get('format').valueChanges.subscribe(format => {
      this.isOtherFormatSelected = format === 'Other';
    });
    this.distributionForm.get('license').valueChanges.subscribe(license => {
      this.isOtherLicenseSelected = license === this.otherLicenseValue;
      if (!this.isOtherLicenseSelected) {
        this.distributionForm.get('licenseOther').setValue('', { emitEvent: false });
      }
    });
    this.distributionForm.get('resourceType').valueChanges.subscribe(type => {
      const downloadControl = this.distributionForm.get('downloadURL');
      const uploadControl = this.distributionForm.get('uploadFile');

      if (type === 'url') {
        downloadControl.setValidators([Validators.required]);
        uploadControl.clearValidators();
        uploadControl.setValue(null, { emitEvent: false });
        if (this.pendingUploadId) {
          this.removePendingUpload(this.pendingUploadId);
          this.removeUploadQueueItem(this.pendingUploadId);
          this.pendingUploadId = null;
        }
        this.selectedUploadFile = null;
        this.selectedMinioObjectKey = null;
        this.uploadedPublicUrl = null;
        this.uploadErrorMessage = null;
      } else if (type === 'file') {
        uploadControl.setValidators([Validators.required]);
        downloadControl.clearValidators();
        downloadControl.setValue('', { emitEvent: false });
        this.selectedMinioObjectKey = null;
        this.uploadedPublicUrl = null;
        this.uploadErrorMessage = null;
      } else if (type === 'minio') {
        uploadControl.setValidators([this.minioSelectionValidator()]);
        downloadControl.clearValidators();
        downloadControl.setValue('', { emitEvent: false });
        if (this.pendingUploadId) {
          this.removePendingUpload(this.pendingUploadId);
          this.removeUploadQueueItem(this.pendingUploadId);
          this.pendingUploadId = null;
        }
        this.selectedUploadFile = null;
        uploadControl.setValue(null, { emitEvent: false });
        this.uploadedPublicUrl = null;
        this.uploadErrorMessage = null;
      } else {
        downloadControl.clearValidators();
        uploadControl.clearValidators();
      }

      downloadControl.updateValueAndValidity({ emitEvent: false });
      uploadControl.updateValueAndValidity({ emitEvent: false });
    });
    this.distributionForm.get('downloadURL').valueChanges.subscribe((url: string) => {
      const detectedFormat = this.getFormatFromUrl(url);
      const formatControl = this.distributionForm.get('format');
      if (!detectedFormat || !formatControl) {
        return;
      }
      formatControl.setValue(detectedFormat);
    });

    // Add validator to dataset form with today's date as default for new datasets
    this.datasetForm = this.fb.group({
      id: ['', [this.forbiddenCharsValidator()]],  // Apply validator
      title: ['', Validators.required], // Title is required
      description: [''],
      name: [''],
      publisher: [''],
      releaseDate: [this.isEditing ? '' : new Date()],  // Only set default for new datasets
      theme: [[]],  // Initialize as empty array
      creator: [''],
      frequency: [''],
      version: ['']
    });
  }

  private getFormatFromUrl(url: string): string | null {
    if (!url) {
      return null;
    }

    const normalizedUrl = url.trim().toLowerCase();
    if (
      normalizedUrl.includes('service=wms') ||
      normalizedUrl.includes('request=getmap') ||
      normalizedUrl.endsWith('/wms')
    ) {
      return 'WMS';
    }

    const cleanUrl = normalizedUrl.split('#')[0].split('?')[0];
    const fileName = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1 || lastDot === fileName.length - 1) {
      return null;
    }

    const extension = fileName.slice(lastDot + 1);
    switch (extension) {
      case 'csv':
        return 'CSV';
      case 'json':
      case 'jsonld':
        return 'JSON';
      case 'geojson':
        return 'GeoJSON';
      case 'xml':
      case 'rdf':
        return 'XML';
      case 'txt':
        return 'TXT';
      case 'xlsx':
      case 'xls':
        return 'XLSX';
      case 'pdf':
        return 'PDF';
      case 'wms':
        return 'WMS';
      default:
        return 'Other';
    }
  }

  // Add this method to edit a distribution
  editDistribution(distribution: any): void {
    this.isEditingDistribution = true;
    this.currentEditingDistributionId = distribution.id;
    
    // Reset and populate the form with existing distribution data
    this.distributionForm.reset();
    
    // Check if this distribution has a custom format
    let format = distribution.format || 'CSV';
    
    // If format doesn't match any standard option (case insensitive and ignore spaces)
    const normalizedFormat = format.replace(/\s+/g, '').toLowerCase();
    const isStandardFormat = this.formatOptions.some(opt => 
      opt.replace(/\s+/g, '').toLowerCase() === normalizedFormat
    );
    
    if (!isStandardFormat) {
      // Keep the format as is
      // No need to set it to 'Other' and use otherFormat
    }
    
    // Convert arrays to single values for form fields
    const accessUrl = Array.isArray(distribution.accessUrl) && distribution.accessUrl.length > 0 
      ? distribution.accessUrl[0] 
      : '';
    
    // Convert string dates to Date objects for the datepicker
    let releaseDate = new Date();
    let modifiedDate = new Date();
    
   if (distribution.releaseDate) {
      
      // Check if date is in JSON-LD format with @value property
      if (typeof distribution.releaseDate === 'object' && distribution.releaseDate['@value']) {
        // Extract the date string from @value
        const dateString = distribution.releaseDate['@value'];
        
        // Parse the extracted date string
        const momentDate = moment(dateString);
        if (momentDate.isValid()) {
          releaseDate = momentDate.toDate();
        }
      } else {
        // Process as regular string format (existing code)
        const momentDate = moment(distribution.releaseDate);
        
        if (momentDate.isValid()) {
          releaseDate = momentDate.toDate();
        } else {
          // Try alternative format parsing
          const formats = ['YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'MM/DD/YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ'];
          
          for (const format of formats) {
            const parsedDate = moment(distribution.releaseDate, format, true);
            if (parsedDate.isValid()) {
              releaseDate = parsedDate.toDate();
              break;
            }
          }
          
          // If still not valid, log warning but keep original string for debugging
          if (!moment(releaseDate).isValid()) {
            console.warn('Could not parse date:', distribution.releaseDate);
            // Keep today's date as fallback
          }
        }
      }
    }
    
    
    if (distribution.modifiedDate) {
      // Check if date is in JSON-LD format with @value property
      if (typeof distribution.modifiedDate === 'object' && distribution.modifiedDate['@value']) {
        // Extract the date string from @value
        const dateString = distribution.modifiedDate['@value'];

        // Parse the extracted date string
        const momentDate = moment(dateString);
        if (momentDate.isValid()) {
          modifiedDate = momentDate.toDate();
        }
      } else {
        // Process as regular string format (existing code)
        const momentDate = moment(distribution.modifiedDate);

        if (momentDate.isValid()) {
          modifiedDate = momentDate.toDate();
        } else {
          // Try alternative format parsing
          const formats = ['YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'MM/DD/YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ'];

          for (const format of formats) {
            const parsedDate = moment(distribution.modifiedDate, format, true);
            if (parsedDate.isValid()) {
              modifiedDate = parsedDate.toDate();
              break;
            }
          }

          // If still not valid, log warning but keep original string for debugging
          if (!moment(modifiedDate).isValid()) {
            console.warn('Could not parse date:', distribution.modifiedDate);
            // Keep today's date as fallback
          }
        }
      }
    }
    
    // Populate the form with existing data
    this.distributionForm.patchValue({
      id: distribution.id,
      title: distribution.title,
      description: distribution.description,
      accessUrl: accessUrl,
      resourceType: distribution.resourceType || (distribution.uploadFile ? 'file' : 'url'),
      downloadURL: distribution.uploadFile ? '' : distribution.downloadURL,
      uploadFile: distribution.uploadFile ?? null,
      format: format,
      byteSize: distribution.byteSize,
      checksum: distribution.checksum,
      rights: distribution.rights,
      mediaType: distribution.mediaType,
      license: distribution.license,
      releaseDate: releaseDate,
      modifiedDate: modifiedDate
    });
    this.selectedUploadFile = distribution.uploadFile ?? null;
    this.selectedMinioObjectKey = distribution.minioObjectKey ?? null;
    this.pendingUploadId = distribution.pendingUploadId ?? null;
    this.normalizeLicenseSelection();
    
    // Only disable the ID field if this is a server-persisted distribution (not local-only)
    // Distributions created via API won't have isNew flag, those only in localStorage will
    if (!distribution.isNew) {
      this.distributionForm.get('id').disable();
    } else {
      // For local-only distributions, enable the ID field
      this.distributionForm.get('id').enable();
    }
    
    // Scroll to the form section
    setTimeout(() => {
      const formElement = document.getElementById('distributionForm');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  // Add this helper method to normalize titles or ID for comparison
  private normalizeString(title: string): string {
    // Remove all spaces and convert to lowercase for consistent comparison
    return title.replace(/\s+/g, '').toLowerCase();
  }

  private forbiddenCharsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Skip validation for empty values
      }
      
      // Check for forbidden characters: colon, slash, semicolon, and spaces
      const forbidden = /[:\/;, ]/;
      const isInvalid = forbidden.test(control.value);
      
      return isInvalid ? { forbiddenChars: { value: control.value } } : null;
    };
  }

  private minioSelectionValidator(): ValidatorFn {
    return (_control: AbstractControl): ValidationErrors | null => {
      const hasMinioSelection = !!this.selectedMinioObjectKey;
      const hasDownloadUrl = !!this.distributionForm?.get('downloadURL')?.value;
      if (hasMinioSelection || hasDownloadUrl) {
        return null;
      }
      return { required: true };
    };
  }

  saveDistributionToLocalStorage(): void {
    // Mark all fields as touched to trigger validation display
    this.markFormGroupTouched(this.distributionForm);
    
    if (this.distributionForm.invalid) {
      this.toastrService.danger(
        this.translation.instant('TOAST_FILL_REQUIRED_FIELDS'),
        this.translation.instant('TOAST_FORM_INVALID')
      );
      return;
    }

    const formData = this.distributionForm.value;
    const licenseValue = this.isOtherLicenseSelected
      ? (formData.licenseOther || '')
      : (formData.license || '');
    
    // Use format value directly - no longer need to check for 'Other'
    const actualFormat = formData.format;

    // Title is required and must be unique
    if (!formData.title.trim()) {
      this.toastrService.danger(
        this.translation.instant('TOAST_TITLE_REQUIRED'),
        this.translation.instant('TOAST_TITLE_REQUIRED_TITLE')
      );
      return;
    }
    
    // Modified: Check title uniqueness among distributions not being edited (ignore spaces)
    const normalizedNewTitle = this.normalizeString(formData.title);
    if (!this.isEditingDistribution && 
        this.distributions.some(d => this.normalizeString(d.title) === normalizedNewTitle)) {
      this.toastrService.danger(
        this.translation.instant('TOAST_DUPLICATE_TITLE'),
        this.translation.instant('TOAST_DUPLICATE_TITLE_TITLE')
      );
      return;
    }
    
    // Modified: If editing, check if new title conflicts with any other distribution (ignore spaces)
    if (this.isEditingDistribution) {
      const existingDistribution = this.distributions.find(d => d.id === this.currentEditingDistributionId);
      if (this.normalizeString(formData.title) !== this.normalizeString(existingDistribution.title) && 
          this.distributions.some(d => 
            this.normalizeString(d.title) === normalizedNewTitle && 
            d.id !== this.currentEditingDistributionId)) {
        this.toastrService.danger(
          this.translation.instant('TOAST_DUPLICATE_TITLE'),
          this.translation.instant('TOAST_DUPLICATE_TITLE_TITLE')
        );
        return;
      }
    }

    // Use the ID provided by the user or pass null
    const distributionId = formData.id || createUniqueId();

    // Find the existing distribution if we're editing
    let existingDistribution = null;
    if (this.isEditingDistribution) {
      existingDistribution = this.distributions.find(d => d.id === this.currentEditingDistributionId);
    }

    // Format the distribution object according to API requirements
    const distribution = {
      // Use the ID from the form if provided, otherwise generate a new one
      // For editing, keep the original ID unless a new one is provided
      id: this.isEditingDistribution 
        ? (existingDistribution?.isNew && formData.id ? formData.id : this.currentEditingDistributionId)
        : distributionId,
      title: formData.title,
      description: formData.description || '',
      accessUrl: formData.accessUrl ? [formData.accessUrl] : [''],
      downloadURL: formData.downloadURL,
      uploadFile: this.selectedUploadFile || null,
      pendingUploadId: this.pendingUploadId || null,
      minioObjectKey: this.selectedMinioObjectKey || null,
      resourceType: formData.resourceType,
      format: actualFormat || 'CSV',
      byteSize: formData.byteSize || 0,
      checksum: formData.checksum || '',
      rights: formData.rights || '',
      mediaType: formData.mediaType || '',
      license: licenseValue,
      releaseDate: formData.releaseDate ? 
        moment(formData.releaseDate).format() : 
        moment().format(),
      modifiedDate: formData.modifiedDate ? 
        moment(formData.modifiedDate).format() : 
        moment().format(),
      isNew: this.isEditingDistribution 
        ? existingDistribution?.isNew || false 
        : true,
      isEdited: this.isEditingDistribution
    };
    

    function createUniqueId() {
      return `${formData.title.replace(/\s+/g, '')}${moment(Date.now()).format().replace(/[-:+]/g, '')}`;
    }
  

    if (this.isEditingDistribution) {
      // When editing a local-storage-only distribution, the ID might have changed
      // So we need to update the ID reference for finding the index
      const index = this.distributions.findIndex(d => d.id === this.currentEditingDistributionId);
      if (index !== -1) {
        this.distributions[index] = distribution;
        this.toastrService.success(
          this.translation.instant('TOAST_CHANGES_SAVED'),
          this.translation.instant('TOAST_CHANGES_SAVED_TITLE')
        );
      }
    } else {
      // Add the new distribution to the local array
      this.distributions.push(distribution);
      this.toastrService.success(
        this.translation.instant('TOAST_DISTRIBUTION_ADDED'),
        this.translation.instant('TOAST_DISTRIBUTION_ADDED_TITLE')
      );
    }
    
    // Reset form and editing state
    this.distributionForm.reset({
      format: 'CSV',
      resourceType: null,
      downloadURL: '',
      uploadFile: null
    });
    this.selectedUploadFile = null;
    this.selectedMinioObjectKey = null;
    this.uploadedPublicUrl = null;
    this.pendingUploadId = null;
    this.isEditingDistribution = false;
    this.currentEditingDistributionId = null;
    this.distributionForm.get('id').enable();
  }

  createDatasetWithDistributions(): void {
    // Mark all fields as touched to trigger validation display
    this.markFormGroupTouched(this.datasetForm);
    
    // Validate dataset form first
    if (this.datasetForm.invalid) {
      this.toastrService.danger(
        this.translation.instant('TOAST_COMPLETE_DATASET_FIELDS'),
        this.translation.instant('TOAST_FORM_INVALID')
      );
      return;
    }
    
    // Get the dataset ID value, accounting for disabled form controls
    const datasetId = this.datasetForm.get('id').value;

    // Check if ID exists and is not empty
    if (!this.isEditing && datasetId && datasetId.trim() !== '') {
      // First check if dataset with this ID already exists using getSingleEntity
      this.isCreatingDataset = true;
      
      this.ngsiDatasetsService.getSingleEntity(datasetId).subscribe({
        next: (existingDataset) => {
          // Dataset with this ID already exists
          this.isCreatingDataset = false;
          this.toastrService.danger(
            this.translation.instant('TOAST_DUPLICATE_DATASET_ID', {id: datasetId}),
            this.translation.instant('TOAST_DUPLICATE_DATASET_ID_TITLE')
          );
        },
        error: (error) => {
          // 404 error means dataset doesn't exist, which is good - continue with creation
          if (error.status === 404) {
            this.proceedWithDatasetCreation();
          } else {
            // Other error occurred during the check
            this.isCreatingDataset = false;
            console.error('Error checking dataset existence:', error);
            this.toastrService.danger(
              'A dataset with this ID already exists. Please change the ID.',
              'Error'
            );
          }
        }
      });
    } else {
      // No ID provided or we're in edit mode, proceed normally
      this.proceedWithDatasetCreation();
    }
  }

  private proceedWithDatasetCreation(): void {
    this.isCreatingDataset = true;
    this.buildUploadQueueForCreation();
    this.openUploadProgressDialog();
    // Count active distributions (not marked for deletion)
    const activeDistributionsCount = this.distributions.filter(d => !d.markedForDeletion).length;
    
    if (activeDistributionsCount === 0) {
      // Show a dialog instead of just a toastr message
      this.dialogService.open(ConfirmationDialogComponent, {
        context: {
          title: this.translation.instant('DIALOG_CANNOT_PROCEED'),
          message: this.translation.instant('DIALOG_NO_ACTIVE_DISTRIBUTIONS'),
          confirmButtonText: this.translation.instant('DIALOG_OK'),
          showCancelButton: false
        },
      });
      this.isCreatingDataset = false;
      this.closeUploadProgressDialog();
      return;
    }
    
    // Process deletions first, then proceed with the rest of the workflow
    if (this.distributionsToDelete.length > 0) {
      this.processDistributionDeletions(0, () => {
        this.processDistributionCreationsAndUpdates();
      });
    } else {
      this.processDistributionCreationsAndUpdates();
    }
  }

  private processDistributionDeletions(index: number, onComplete: () => void): void {
    if (index >= this.distributionsToDelete.length) {
      // All deletions processed
      onComplete();
      return;
    }
    
    const distributionId = this.distributionsToDelete[index];
    
    this.ngsiDatasetsService.deleteDistribution(distributionId).subscribe({
      next: () => {
        // Process next deletion
        this.processDistributionDeletions(index + 1, onComplete);
      },
      error: (error) => {
        console.error(`Error deleting distribution ${distributionId}:`, error);
        this.isCreatingDataset = false;
        this.closeUploadProgressDialog();
        this.toastrService.danger(
          this.translation.instant('TOAST_DELETE_DISTRIBUTION_FAILED'),
          this.translation.instant('TOAST_DISTRIBUTION_DELETION_ERROR')
        );
        // Don't proceed if deletion fails
      }
    });
  }

  private processDistributionCreationsAndUpdates(): void {
    // Filter out distributions marked for deletion
    const activeDistributions = this.distributions.filter(d => !d.markedForDeletion);
    const newDistributions = activeDistributions.filter(d => d.isNew === true);
    const editedDistributions = activeDistributions.filter(d => d.isEdited === true && !d.isNew);
    
    // Create a deep copy of distributions array to avoid modifying the UI list during processing
    this.pendingDistributions = [...newDistributions, ...editedDistributions];
    
    if (this.pendingDistributions.length === 0) {
      // If no distributions need to be created or updated, proceed directly to dataset creation
      this.createOrUpdateDataset();
      return;
    }
    
    // Process distributions sequentially
    this.processNextDistribution(0, () => {
      // All distributions processed successfully, now create the dataset
      this.createOrUpdateDataset();
    });
  }

  private processNextDistribution(index: number, onComplete: () => void): void {
    if (index >= this.pendingDistributions.length) {
      // All distributions processed successfully
      onComplete();
      return;
    }
    
    const distribution = this.pendingDistributions[index];

    this.uploadDistributionFileIfNeeded(distribution).subscribe({
      next: (publicUrl) => {
        if (publicUrl) {
          distribution.downloadURL = publicUrl;
        }

        // Remove the flags we added, which aren't needed for the API
        const {
          isNew,
          isEdited,
          markedForDeletion,
          uploadFile,
          pendingUploadId,
          minioObjectKey,
          resourceType,
          ...distToSend
        } = distribution;

        // Choose between create or update based on the isNew flag
        const operation = distribution.isNew
          ? this.ngsiDatasetsService.createDistribution(distToSend)
          : this.ngsiDatasetsService.updateDistribution(distribution.id, distToSend);

        operation.subscribe({
          next: () => {
            // Process the next distribution
            this.processNextDistribution(index + 1, onComplete);
          },
          error: (error) => {
            this.isCreatingDataset = false;
            this.closeUploadProgressDialog();

            // Handle 409 Conflict error specifically
            if (error.status === 409) {
              this.toastrService.danger(
                this.translation.instant('TOAST_DUPLICATE_DISTRIBUTION', { title: distribution.title }),
                this.translation.instant('TOAST_DUPLICATE_DISTRIBUTION_TITLE')
              );
            } else {
              console.error(
                `Error ${distribution.isNew ? 'creating' : 'updating'} distribution ${distribution.id}:`,
                error
              );
              this.toastrService.danger(
                `Failed to ${distribution.isNew ? 'create' : 'update'} distribution "${distribution.title}". Dataset creation aborted.`,
                'Distribution Error'
              );
            }
            // Do not proceed to dataset creation
          }
        });
      },
      error: (error) => {
        this.isCreatingDataset = false;
        this.closeUploadProgressDialog();
        this.toastrService.danger(
          error?.message || 'Unable to upload file to MinIO.',
          this.translation.instant('TOAST_FORM_INVALID')
        );
      }
    });
  }

  private createOrUpdateDataset(): void {
    const formValue = this.datasetForm.getRawValue();
    
    // Get only distribution IDs that aren't marked for deletion
    const datasetDistribution = this.distributions
      .filter(dist => !dist.markedForDeletion)
      .map(dist => dist.id);
    
    // Get spatial data from localStorage, but don't require it
    const storedDataset = localStorage.getItem('dataset_to_edit');
    let spatialData = null;
    
    if (storedDataset) {
      const parsedStoredDataset = JSON.parse(storedDataset);
      // Check if spatial data exists and is not empty
      if (parsedStoredDataset.spatial && parsedStoredDataset.spatial !== null) {
        // Make sure that spatialData is always an array if it exists
        spatialData = [parsedStoredDataset.spatial];
      };
    }
    
    // Format date with time component using Moment.js
    const releaseDate = formValue.releaseDate ? 
      moment(formValue.releaseDate).format() : 
      null;
    
    // Check if the theme array is empty and apply the [""]
    const themeValue = !formValue.theme || formValue.theme.length === 0 ? [""] : formValue.theme;
    
    // Check if frequency is null or undefined and apply ""
    const frequencyValue = !formValue.frequency ? "" : formValue.frequency;
    
    // Create the dataset object including keywords, contact points, and themes
    let dataset = {
      ...formValue,
      releaseDate,
      datasetDistribution,
      spatial: spatialData, // This can now be null
      contactPoint: this.contactPointArray.length === 0 ? [""] : this.contactPointArray,
      keyword: this.keywordArray.length === 0 ? [""] : this.keywordArray,
      theme: themeValue,
      frequency: frequencyValue,
      accessRights: 'public'
    };
    
    // If ID is empty or just whitespace, remove it from the payload and let backend generate it
    if (!formValue.id || formValue.id.trim() === '') {
      delete dataset.id;
    }
    
    // Remove ID from the payload when updating
    const datasetId = formValue.id;
    if (this.isEditing) {
      const { id, ...datasetWithoutId } = dataset;
      dataset = datasetWithoutId;
    }
    
    // Choose between create or update
    let operation: any;
    if (this.isEditing) {
      // if editing, remove "urn:ngsi-ld:DistributionDCAT-AP:id:" prefix from the distributuions ID
      const updatedDistributions = dataset.datasetDistribution.map((distId: string) => {
        return distId.replace('urn:ngsi-ld:DistributionDCAT-AP:id:', '');
      });

      dataset.datasetDistribution = updatedDistributions;

      operation = this.ngsiDatasetsService.updateDataset(datasetId, dataset);
    } else {
      operation = this.ngsiDatasetsService.createDataset(dataset);
    }
    
    operation.subscribe({
      next: () => {
        // Clear localStorage
        localStorage.removeItem('dataset_to_edit');
        // Reset form and navigate back
        this.datasetForm.reset();
        this.distributions = [];
        this.isCreatingDataset = false;
        this.closeUploadProgressDialog();
        this.router.navigate(['/pages/administration/datasets-ngsi'], 
          {
          queryParamsHandling: 'merge',
          });
        this.toastrService.success(
          this.isEditing ? 
            this.translation.instant('TOAST_DATASET_UPDATED') : 
            this.translation.instant('TOAST_DATASET_CREATED'),
          this.translation.instant('TOAST_SUCCESS')
        );
      },
      error: (error) => {
        console.error(`Error ${this.isEditing ? 'updating' : 'creating'} dataset:`, error);
        this.isCreatingDataset = false;
        this.closeUploadProgressDialog();
        this.toastrService.danger(
          `Failed to ${this.isEditing ? 'update' : 'create'} dataset: ${error.message || 'Unknown error'}`,
          'Dataset Error'
        );
      }
    });
  }

  cancelEditDistribution(): void {
    this.distributionForm.reset({
      format: 'CSV',
      otherFormat: '',
      resourceType: null,
      downloadURL: '',
      uploadFile: null
    });
    this.selectedUploadFile = null;
    this.selectedMinioObjectKey = null;
    this.uploadedPublicUrl = null;
    this.isEditingDistribution = false;
    this.currentEditingDistributionId = null;
    this.distributionForm.get('id').enable();
  }

  removeDistribution(index: number): void {
    const distributionToDelete = this.distributions[index];
    
    if (!distributionToDelete || !distributionToDelete.title) {
      console.error('Invalid distribution or missing title');
      return;
    }
    
    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Mark Distribution for Deletion',
        message: `Are you sure you want to delete distribution "${distributionToDelete.title}"? The deletion will be processed when the dataset is updated.`,
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        this.clearPendingForDistribution(distributionToDelete);
        // If it's a new distribution (not yet persisted), just remove it from the list
        if (distributionToDelete.isNew) {
          this.distributions.splice(index, 1);
          this.toastrService.success(
            this.translation.instant('TOAST_DISTRIBUTION_REMOVED', {title: distributionToDelete.title}),
            this.translation.instant('TOAST_DISTRIBUTION_REMOVED_TITLE')
          );
        } else {
          // Mark existing distribution for deletion
          distributionToDelete.markedForDeletion = true;
          
          // Add to array of distributions to delete
          if (!this.distributionsToDelete.includes(distributionToDelete.id)) {
            this.distributionsToDelete.push(distributionToDelete.id);
          }
          
          this.toastrService.success(
            this.translation.instant('TOAST_DISTRIBUTION_MARKED_DELETION', {title: distributionToDelete.title}),
            this.translation.instant('TOAST_DISTRIBUTION_MARKED_DELETION_TITLE')
          );
        }
      }
    });
  }

  undoDeleteDistribution(index: number): void {
    const distribution = this.distributions[index];
    
    if (distribution) {
      // Remove the markedForDeletion flag
      distribution.markedForDeletion = false;
      
      // Remove from distributionsToDelete array
      const deleteIndex = this.distributionsToDelete.indexOf(distribution.id);
      if (deleteIndex !== -1) {
        this.distributionsToDelete.splice(deleteIndex, 1);
      }
      
      this.toastrService.success(
        this.translation.instant('TOAST_DISTRIBUTION_RESTORED', {title: distribution.title}),
        this.translation.instant('TOAST_DISTRIBUTION_RESTORED_TITLE')
      );
    }
  }

  /**
   * Removes a distribution from the local list without deleting it from the system
   * @param index Index of the distribution to remove
   */
  removeDistributionFromList(index: number): void {
    if (index < 0 || index >= this.distributions.length) {
      console.error('Invalid distribution index:', index);
      return;
    }
    
    const distributionToRemove = this.distributions[index];
    
    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Remove Distribution',
        message: `Are you sure you want to remove "${distributionToRemove.title}" from the list? The distribution will not be deleted from the system.`,
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        this.clearPendingForDistribution(distributionToRemove);
        // Rimuove la distribuzione solo dall'array locale senza chiamare l'API di eliminazione
        this.distributions.splice(index, 1);
        
        this.toastrService.success(
          this.translation.instant('TOAST_DISTRIBUTION_REMOVED', {title: distributionToRemove.title}),
          this.translation.instant('TOAST_DISTRIBUTION_REMOVED_TITLE')
        );
      }
    });
  }

  private clearPendingForDistribution(distribution: any): void {
    if (!distribution) {
      return;
    }
    const pendingId = distribution.pendingUploadId;
    if (pendingId) {
      this.removePendingUpload(pendingId);
      this.removeUploadQueueItem(pendingId);
    }
  }

  onDateSelect(date: Date, controlName: string) {
    if (date) {
      const momentDate = moment(date);
      if (momentDate.isValid()) {
        if (controlName === 'releaseDate') {
          this.distributionForm.get('releaseDate')?.setValue(momentDate.toDate());
        } else if (controlName === 'datasetReleaseDate') {
          this.datasetForm.get('releaseDate')?.setValue(momentDate.toDate());
        }
      }
    }
  }

  loadDistributions(existingDataset: any = null): void {
    this.loadingDistributions = true;
    
    this.ngsiDatasetsService.getDistributions().subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.distributions = response;
          
          
          if (existingDataset && existingDataset.datasetDistribution) {
            // For editing: select only distributions that were part of the dataset
            // Ensure distributionIds is always an array
            let distributionIds = existingDataset.datasetDistribution;
            
            // Convert to array if it's not already
            if (!Array.isArray(distributionIds)) {
              if (typeof distributionIds === 'string') {
                // If it's a single string ID, wrap it in an array
                distributionIds = [distributionIds];
              } else {
                // If it's something else entirely, default to empty array
                distributionIds = [];
                console.warn('datasetDistribution is not an array or string:', distributionIds);
              }
            }
            
          } 
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

  // Add a method to populate the form with existing dataset data
  populateDatasetForm(dataset: any): void {
    
    // Parse the date properly using Moment.js
    let releaseDate = new Date(); // Default to today for new datasets

    if (dataset.releaseDate) {
      
      // Check if date is in JSON-LD format with @value property
      if (typeof dataset.releaseDate === 'object' && dataset.releaseDate['@value']) {
        // Extract the date string from @value
        const dateString = dataset.releaseDate['@value'];
        
        // Parse the extracted date string
        const momentDate = moment(dateString);
        if (momentDate.isValid()) {
          releaseDate = momentDate.toDate();
        }
      } else {
        // Process as regular string format (existing code)
        const momentDate = moment(dataset.releaseDate);
        
        if (momentDate.isValid()) {
          releaseDate = momentDate.toDate();
        } else {
          // Try alternative format parsing
          const formats = ['YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'MM/DD/YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ'];
          
          for (const format of formats) {
            const parsedDate = moment(dataset.releaseDate, format, true);
            if (parsedDate.isValid()) {
              releaseDate = parsedDate.toDate();
              break;
            }
          }
          
          // If still not valid, log warning but keep original string for debugging
          if (!moment(releaseDate).isValid()) {
            console.warn('Could not parse date:', dataset.releaseDate);
            // Keep today's date as fallback
          }
        }
      }
    }
    
    // Set theme correctly based on type
    let themeValue = [];
    if (dataset.theme) {
      if (Array.isArray(dataset.theme)) {
        themeValue = dataset.theme;
      } else if (typeof dataset.theme === 'string') {
        themeValue = [dataset.theme]; // Convert single string to array with one element
      }
    }
    
    // Set simple fields
    this.datasetForm.patchValue({
      id: dataset.id || '',
      title: dataset.title || '',
      description: dataset.description || '',
      name: dataset.name || '',
      publisher: dataset.publisher || '',
      releaseDate: releaseDate, 
      creator: dataset.creator || '',
      frequency: dataset.frequency || '',
      version: dataset.version || '',
      theme: themeValue 
    });

      // Disable the ID field when editing
    if (this.isEditing) {
      this.datasetForm.get('id').disable();
    }
    
    // Set contact points using contactPointArray
    if (dataset.contactPoint) {
      if (Array.isArray(dataset.contactPoint)) {
        this.contactPointArray = [...dataset.contactPoint];
      } else if (typeof dataset.contactPoint === 'string') {
        this.contactPointArray = [dataset.contactPoint];
      } else {
        this.contactPointArray = [];
      }
  
    } else {
      this.contactPointArray = [];
    }
    
    
    // Set keywords using keywordArray - handle different possible formats
    if (dataset.keyword) {
      if (Array.isArray(dataset.keyword)) {
        // It's already an array, use it directly
        this.keywordArray = [...dataset.keyword];
      } else if (typeof dataset.keyword === 'string') {
        // It's a string, try to split it if it contains commas
        this.keywordArray = dataset.keyword.split(',').map(k => k.trim()).filter(k => k);
      } else {
        // Unknown format, initialize empty array
        this.keywordArray = [];
      }
    } else {
      // No keywords, initialize empty array
      this.keywordArray = [];
    }
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

  // Open map dialog when clicking on the map
  openMapDialog() {
    // Store the current scroll position
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    
    // Hide the background map completely
    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.classList.add('map-hidden');
    }
    
    this.dialogService.open(MapDialogComponent, {
      hasBackdrop: true,
      closeOnBackdropClick: true,
      closeOnEsc: true,
      dialogClass: 'map-dialog-fixed',
      hasScroll: false
    })
    .onClose.subscribe(newSpatial => {
      // Show the map again
      if (mapElement) {
        mapElement.classList.remove('map-hidden');
      }
      
      // Restore scroll position
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 0);
      
      // Handle result
      if (newSpatial) {
        // Clean up and reinitialize the map
      this.cleanupMap();
      setTimeout(() => {
        this.initMap();
      }, 100);
      }
    });
  }

  // New method to load only distributions associated with a dataset
  loadDistributionsForDataset(dataset: any): void {
    if (!dataset || !dataset.datasetDistribution) {
      this.distributions = [];
      return;
    }

    this.loadingDistributions = true;
    
    // Ensure distributionIds is always an array
    let distributionIds = dataset.datasetDistribution;
    if (!Array.isArray(distributionIds)) {
      distributionIds = typeof distributionIds === 'string' ? [distributionIds] : [];
    }
    
    if (distributionIds.length === 0) {
      this.loadingDistributions = false;
      this.distributions = [];
      return;
    }

    // Get all distributions and filter them
    this.ngsiDatasetsService.getDistributions().subscribe({
      next: (allDistributions) => {
        if (!allDistributions || allDistributions.length === 0) {
          this.distributions = [];
          this.loadingDistributions = false;
          return;
        }
        
        // Filter to keep only distributions associated with this dataset
        this.distributions = allDistributions.filter(dist => {
          return distributionIds.some(datasetId => {
            // Convert both to strings for consistency
            const dsId = String(datasetId);
            const distId = String(dist.id);
            
            // Direct match
            if (dsId === distId) return true;
            
            // Extract identifier part after "id:" or "items:" in both IDs
            const getIdPart = (id: string): string => {
              if (id.includes(':id:')) {
                return id.split(':id:')[1];
              } else if (id.includes(':items:')) {
                return id.split(':items:')[1];
              }
              return id;
            };
            
            const datasetIdPart = getIdPart(dsId);
            const distributionIdPart = getIdPart(distId);
            
            // Compare the extracted identifier parts
            return datasetIdPart === distributionIdPart;
          });
        });
        
        this.loadingDistributions = false;
      },
      error: (error) => {
        console.error('Error loading distributions for dataset:', error);
        this.distributions = [];
        this.loadingDistributions = false;
      }
    });
  }

  // Add this method to load existing dataset IDs
  loadExistingDatasetIds(): void {
    this.ngsiDatasetsService.getDatasets().subscribe({
      next: (datasets) => {
        this.existingDatasetIds = datasets.map(dataset => dataset.id);
      },
      error: (error) => {
        console.error('Error loading dataset IDs:', error);
        this.existingDatasetIds = [];
      }
    });
  }

  // Method to add a keyword from the input field
  addKeywordFromInput(inputElement: HTMLInputElement): void {
    const value = inputElement.value?.trim();
    
    if (value && value.length > 0) {
      // Check if we've reached the maximum number of keywords
      if (this.keywordArray.length >= 10) {
        this.toastrService.warning(
          this.translation.instant('TOAST_KEYWORDS_LIMIT'),
          this.translation.instant('TOAST_KEYWORDS_LIMIT_TITLE')
        );
        return;
      }
      
      // Check for duplicates (case-insensitive)
      const isDuplicate = this.keywordArray.some(
        keyword => keyword.toLowerCase() === value.toLowerCase()
      );
      
      if (!isDuplicate) {
        this.keywordArray.push(value);
      } else {
        this.toastrService.warning(
          this.translation.instant('TOAST_DUPLICATE_KEYWORD', {value: value}),
          this.translation.instant('TOAST_DUPLICATE_KEYWORD_TITLE')
        );
      }
      
      // Clear the input
      inputElement.value = '';
      
      // Focus back on the input for easy addition of multiple tags
      inputElement.focus();
    }
  }

  // Method to remove a keyword from the array
  removeKeywordTag(keyword: string): void {
    const index = this.keywordArray.indexOf(keyword);
    if (index !== -1) {
      this.keywordArray.splice(index, 1);
    }
  }

  // Method to add a contact point from the input field
  addContactPointFromInput(inputElement: HTMLInputElement): void {
    const value = inputElement.value?.trim();
    
    if (value && value.length > 0) {
      // Check if we've reached the maximum number of contact points
      if (this.contactPointArray.length >= 5) {
        this.toastrService.warning(
          this.translation.instant('TOAST_CONTACT_POINTS_LIMIT'),
          this.translation.instant('TOAST_CONTACT_POINTS_LIMIT_TITLE')
        );
        return;
      }
      
      // Check for duplicates (case-insensitive)
      const isDuplicate = this.contactPointArray.some(
        contact => contact.toLowerCase() === value.toLowerCase()
      );
      
      if (!isDuplicate) {
        this.contactPointArray.push(value);
      } else {
        this.toastrService.warning(
          this.translation.instant('TOAST_CONTACT_POINT_EXISTS', {value: value}),
          this.translation.instant('TOAST_DUPLICATE_CONTACT_POINT')
        );
      }
      
      // Clear the input
      inputElement.value = '';
      
      // Focus back on the input for easy addition of multiple contact points
      inputElement.focus();
    }
  }

  // Method to remove a contact point from the array
  removeContactPointTag(contact: string): void {
    const index = this.contactPointArray.indexOf(contact);
    if (index !== -1) {
      this.contactPointArray.splice(index, 1);
    }
  }

  onDistributionFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedUploadFile = input?.files?.[0] ?? null;
    this.selectedMinioObjectKey = null;
    this.uploadErrorMessage = null;
    this.uploadedPublicUrl = null;
    if (!this.selectedUploadFile || !this.distributionForm) {
      if (this.distributionForm) {
        this.distributionForm.get('uploadFile')?.setValue(null);
      }
      return;
    }
    this.distributionForm.get('uploadFile')?.setValue(this.selectedUploadFile);
    this.distributionForm.get('downloadURL')?.setValue('');
    // Ensure resource type is set to file when a file is selected.
    if (this.distributionForm.get('resourceType')?.value !== 'file') {
      this.distributionForm.get('resourceType')?.setValue('file');
    }

    const fileName = this.selectedUploadFile.name || '';
    this.applyFileNameMetadata(fileName);
    this.distributionForm.get('uploadFile')?.updateValueAndValidity({ emitEvent: false });
    this.queueFileForUpload(this.selectedUploadFile);
  }

  openMinioBrowser(): void {
    if (this.isListingMinioObjects) {
      return;
    }
    this.isListingMinioObjects = true;
    this.openMinioBrowserDialog();
  }

  onMinioObjectSelected(objectKey: string): void {
    if (!objectKey) {
      this.selectedMinioObjectKey = null;
      if (this.pendingUploadId) {
        this.removePendingUpload(this.pendingUploadId);
        this.removeUploadQueueItem(this.pendingUploadId);
      }
      this.pendingUploadId = null;
      this.uploadedPublicUrl = null;
      this.distributionForm.get('downloadURL')?.setValue('');
      this.distributionForm.get('uploadFile')?.updateValueAndValidity({ emitEvent: false });
      return;
    }
    this.selectedMinioObjectKey = objectKey;
    this.selectedUploadFile = null;
    if (this.pendingUploadId) {
      this.removePendingUpload(this.pendingUploadId);
      this.removeUploadQueueItem(this.pendingUploadId);
    }
    this.pendingUploadId = null;
    this.uploadErrorMessage = null;
    this.uploadedPublicUrl = null;
    this.distributionForm.get('uploadFile')?.setValue(null, { emitEvent: false });
    this.distributionForm.get('downloadURL')?.setValue('');
    if (this.distributionForm.get('resourceType')?.value !== 'minio') {
      this.distributionForm.get('resourceType')?.setValue('minio');
    }

    const fileName = objectKey.split('/').pop() || objectKey;
    this.applyFileNameMetadata(fileName);

    this.minioBrowseService.getPublicUrlForObject(objectKey).subscribe({
      next: (url) => {
        this.uploadedPublicUrl = url;
        this.distributionForm.get('downloadURL')?.setValue(url);
        this.distributionForm.get('uploadFile')?.updateValueAndValidity({ emitEvent: false });
      },
      error: (error) => {
        this.uploadedPublicUrl = null;
        this.uploadErrorMessage = 'Unable to build MinIO URL.';
        console.error('MinIO URL build failed:', error);
        this.distributionForm.get('uploadFile')?.updateValueAndValidity({ emitEvent: false });
      },
    });
  }

  clearSelectedFile(): void {
    if (this.pendingUploadId) {
      this.removePendingUpload(this.pendingUploadId);
      this.removeUploadQueueItem(this.pendingUploadId);
    }
    this.pendingUploadId = null;
    this.selectedUploadFile = null;
    this.selectedMinioObjectKey = null;
    this.uploadedPublicUrl = null;
    this.uploadErrorMessage = null;
    this.distributionForm.get('uploadFile')?.setValue(null, { emitEvent: false });
    this.distributionForm.get('downloadURL')?.setValue('');
    this.distributionForm.get('uploadFile')?.updateValueAndValidity({ emitEvent: false });
    this.toastrService.success(
      'Selection removed from storage.',
      this.translation.instant('TOAST_SUCCESS')
    );
  }

  private async queueFileForUpload(file: File): Promise<void> {
    if (!file || this.isUploadingFile) {
      return;
    }

    this.isUploadingFile = true;
    this.uploadErrorMessage = null;

    try {
      if (this.pendingUploadId) {
        this.removePendingUpload(this.pendingUploadId);
        this.removeUploadQueueItem(this.pendingUploadId);
      }
      const pendingId = await this.storePendingUpload(file);
      this.pendingUploadId = pendingId;
      this.upsertUploadQueueItem(pendingId, file.name, {
        progress: 0,
        status: 'pending',
      });
      this.toastrService.success(
        'File saved locally. It will be uploaded later.',
        this.translation.instant('TOAST_SUCCESS')
      );
    } catch (error) {
      this.uploadErrorMessage = 'Unable to save file locally.';
      console.error('Local file save failed:', error);
      this.toastrService.danger(
        this.uploadErrorMessage,
        this.translation.instant('TOAST_FORM_INVALID')
      );
    } finally {
      this.isUploadingFile = false;
    }
  }

  private uploadDistributionFileIfNeeded(distribution: any) {
    if (!distribution) {
      return of(null);
    }

    const existingUrl = (distribution.downloadURL || '').trim();
    if (existingUrl) {
      return of(null);
    }

    const uploadFile = distribution.uploadFile;
    const queueId = distribution.pendingUploadId || distribution.id || '';

    if (uploadFile instanceof File) {
      if (queueId) {
        this.upsertUploadQueueItem(queueId, uploadFile.name, {
          status: 'uploading',
          progress: 0,
        });
      }
      return this.minioUploadService
        .uploadFileWithProgress(uploadFile, (progress) => {
          if (queueId) {
            this.updateUploadQueueProgress(queueId, progress, 'uploading');
          }
        })
        .pipe(
          map((result) => {
            if (distribution.pendingUploadId) {
              this.removePendingUpload(distribution.pendingUploadId);
              if (queueId) {
                this.updateUploadQueueProgress(queueId, 100, 'done');
              }
            } else if (queueId) {
              this.updateUploadQueueProgress(queueId, 100, 'done');
            }
            return result.publicUrl;
          }),
          catchError((error) => {
            if (queueId) {
              this.updateUploadQueueProgress(queueId, 0, 'error');
            }
            return throwError(() => error);
          })
        );
    }

    if (!distribution.pendingUploadId) {
      return of(null);
    }

    if (queueId) {
      const pending = this.getPendingUploadById(queueId);
      this.upsertUploadQueueItem(queueId, pending?.name || 'Pending file', {
        status: 'uploading',
        progress: 0,
      });
    }

    return from(this.resolvePendingFile(distribution.pendingUploadId)).pipe(
      switchMap((file) =>
        file
          ? this.minioUploadService.uploadFileWithProgress(file, (progress) => {
              if (queueId) {
                this.updateUploadQueueProgress(queueId, progress, 'uploading');
              }
            })
          : throwError(() => new Error('Pending file not found in session storage.'))
      ),
      map((result) => {
        this.removePendingUpload(distribution.pendingUploadId);
        if (queueId) {
          this.updateUploadQueueProgress(queueId, 100, 'done');
        }
        return result.publicUrl;
      }),
      catchError((error) => {
        if (queueId) {
          this.updateUploadQueueProgress(queueId, 0, 'error');
        }
        return throwError(() => error);
      })
    );
  }

  private async storePendingUpload(file: File): Promise<string> {
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    this.pendingFileCache.set(uploadId, file);

    try {
      const dataUrl = await this.readFileAsDataUrl(file);
      const uploads = this.getPendingUploadsFromStorage();
      uploads.push({
        id: uploadId,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        savedAt: new Date().toISOString(),
      });
      sessionStorage.setItem(this.pendingUploadStorageKey, JSON.stringify(uploads));
      return uploadId;
    } catch (error) {
      this.pendingFileCache.delete(uploadId);
      throw error;
    }
  }

  private async resolvePendingFile(uploadId: string): Promise<File | null> {
    const cached = this.pendingFileCache.get(uploadId);
    if (cached) {
      return cached;
    }

    const pending = this.getPendingUploadById(uploadId);
    if (!pending) {
      return null;
    }

    const file = this.dataUrlToFile(pending.dataUrl, pending.name, pending.type);
    this.pendingFileCache.set(uploadId, file);
    return file;
  }

  private getPendingUploadsFromStorage(): PendingUpload[] {
    const raw = sessionStorage.getItem(this.pendingUploadStorageKey);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to parse pending uploads from storage:', error);
      return [];
    }
  }

  private getPendingUploadById(uploadId: string): PendingUpload | null {
    const uploads = this.getPendingUploadsFromStorage();
    return uploads.find((upload) => upload.id === uploadId) ?? null;
  }

  private removePendingUpload(uploadId: string): void {
    if (!uploadId) {
      return;
    }
    this.pendingFileCache.delete(uploadId);
    const uploads = this.getPendingUploadsFromStorage().filter(
      (upload) => upload.id !== uploadId,
    );
    sessionStorage.setItem(this.pendingUploadStorageKey, JSON.stringify(uploads));
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private dataUrlToFile(dataUrl: string, fileName: string, mimeType: string): File {
    const [header, base64] = dataUrl.split(',');
    const binary = atob(base64 || '');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], fileName, { type: mimeType || this.extractMimeType(header) });
  }

  private extractMimeType(header: string): string {
    const match = header?.match(/data:(.*?);base64/);
    return match?.[1] || 'application/octet-stream';
  }

  private buildUploadQueueForCreation(): void {
    const activeDistributions = this.distributions.filter(
      (dist) => !dist.markedForDeletion,
    );

    this.uploadQueue = activeDistributions
      .filter((dist) => {
        const hasPending = !!dist.pendingUploadId;
        const hasFile = dist.uploadFile instanceof File;
        const hasUrl = (dist.downloadURL || '').trim().length > 0;
        return (hasPending || hasFile) && !hasUrl;
      })
      .map((dist) => {
        const queueId = dist.pendingUploadId || dist.id;
        if (!queueId) {
          return null;
        }
        const pending = dist.pendingUploadId
          ? this.getPendingUploadById(dist.pendingUploadId)
          : null;
        const name =
          dist.uploadFile?.name ||
          pending?.name ||
          dist.title ||
          'File';
        return {
          id: queueId,
          name,
          progress: 0,
          status: 'pending' as UploadStatus,
        };
      })
      .filter((item): item is UploadQueueItem => !!item);
  }

  private openUploadProgressDialog(): void {
    if (!this.uploadQueue.length || this.uploadProgressDialogRef) {
      return;
    }
    this.uploadProgressDialogRef = this.dialogService.open(UploadProgressDialogComponent, {
      hasBackdrop: true,
      closeOnBackdropClick: false,
      closeOnEsc: false,
      context: {
        items: this.uploadQueue,
      },
    });
  }

  private closeUploadProgressDialog(): void {
    if (!this.uploadProgressDialogRef) {
      return;
    }
    this.uploadProgressDialogRef.close();
    this.uploadProgressDialogRef = undefined;
  }

  private upsertUploadQueueItem(
    id: string,
    name: string,
    patch: Partial<UploadQueueItem> = {},
  ): void {
    if (!id) {
      return;
    }
    const existing = this.uploadQueue.find((item) => item.id === id);
    if (existing) {
      existing.name = name || existing.name;
      Object.assign(existing, patch);
      return;
    }
    this.uploadQueue.push({
      id,
      name,
      progress: patch.progress ?? 0,
      status: patch.status ?? 'pending',
    });
  }

  private updateUploadQueueProgress(
    id: string,
    progress: number,
    status?: UploadStatus,
  ): void {
    if (!id) {
      return;
    }
    const entry = this.uploadQueue.find((item) => item.id === id);
    if (!entry) {
      return;
    }
    entry.progress = Math.max(0, Math.min(100, Math.round(progress)));
    if (status) {
      entry.status = status;
    }
  }

  private removeUploadQueueItem(id: string): void {
    if (!id) {
      return;
    }
    this.uploadQueue = this.uploadQueue.filter((item) => item.id !== id);
  }

  private openMinioBrowserDialog(): void {
    const dialogRef = this.dialogService.open(MinioBrowserDialogComponent, {
      hasBackdrop: true,
      closeOnBackdropClick: true,
      closeOnEsc: true,
      context: {
        selectedKey: this.selectedMinioObjectKey,
      },
    });

    dialogRef.onClose.subscribe((objectKey?: string) => {
      this.isListingMinioObjects = false;
      if (objectKey) {
        this.onMinioObjectSelected(objectKey);
      }
    });
  }

  private applyFileNameMetadata(fileName: string): void {
    if (!this.distributionForm) {
      return;
    }
    const titleControl = this.distributionForm.get('title');
    const formatControl = this.distributionForm.get('format');

    if (titleControl && (!titleControl.value || !titleControl.dirty)) {
      const baseName = fileName.includes('.')
        ? fileName.slice(0, fileName.lastIndexOf('.'))
        : fileName;
      titleControl.setValue(baseName);
    }

    const detectedFormat = this.getFormatFromUrl(fileName);
    if (detectedFormat && formatControl) {
      formatControl.setValue(detectedFormat);
    }
  }

  private loadLicenseOptions(): void {
    this.http.get<Array<string | LicenseOption> | { licenses: Array<string | LicenseOption> }>('assets/licenses.json')
      .subscribe({
        next: (data) => {
          const rawOptions = Array.isArray(data) ? data : (data?.licenses ?? []);
          this.licenseOptions = (rawOptions ?? [])
            .map((option) => {
              if (typeof option === 'string') {
                return { value: option, label: option };
              }
              return {
                value: option?.value ?? '',
                label: option?.label ?? option?.value ?? '',
              };
            })
            .filter(option => option.value && option.label);
          this.normalizeLicenseSelection();
        },
        error: () => {
          this.licenseOptions = [];
        },
      });
  }

  private normalizeLicenseSelection(): void {
    if (!this.distributionForm) return;
    const licenseControl = this.distributionForm.get('license');
    const otherControl = this.distributionForm.get('licenseOther');
    const current = licenseControl?.value;

    if (!current) {
      this.isOtherLicenseSelected = false;
      return;
    }

    if (current === this.otherLicenseValue) {
      this.isOtherLicenseSelected = true;
      return;
    }

    const matched = this.licenseOptions.find(option => option.value === current || option.label === current);
    if (matched) {
      if (matched.value !== current) {
        licenseControl?.setValue(matched.value, { emitEvent: false });
      }
      this.isOtherLicenseSelected = false;
      return;
    }

    licenseControl?.setValue(this.otherLicenseValue, { emitEvent: false });
    otherControl?.setValue(current, { emitEvent: false });
    this.isOtherLicenseSelected = true;
  }

  isDatasetFormValid(): boolean {
    // Check if form is valid
    if (this.datasetForm.invalid) {
      return false;
    }
    
    // Check required fields explicitly
    const title = this.datasetForm.get('title');
    const releaseDate = this.datasetForm.get('releaseDate');
    
    if (!title?.value || !releaseDate?.value) {
      return false;
    }
    
    // Check if there are any active distributions
    return this.hasActiveDistributions();
  }

  /**
   * Reset spatial data and clear map markers
   */
  resetSpatial(): void {
    // Show confirmation dialog
    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Reset Spatial Data',
        message: 'Are you sure you want to clear the spatial data? This will remove the location from the map.',
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        
        // Clear the map by removing all layers
        if (this.map) {
          this.map.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.Polygon || layer instanceof L.Polyline) {
              this.map.removeLayer(layer);
            }
          });
        //recenter the map to the default position
        this.map.setView([47, 6], 3); // Adjust the coordinates and zoom level as needed
        }

        const storedDataset = localStorage.getItem('dataset_to_edit');
          if (storedDataset) {
            const parsedDataset = JSON.parse(storedDataset);
            parsedDataset.spatial = null;
            localStorage.setItem('dataset_to_edit', JSON.stringify(parsedDataset));
          }
        
        this.toastrService.success(
          this.translation.instant('TOAST_SPATIAL_CLEARED'),
          this.translation.instant('TOAST_SUCCESS')
        );
      }
    });
  }
}
