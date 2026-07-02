import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NbDialogRef, NbToastrService } from '@nebular/theme';
import { DCATDistribution } from '../../model/dcatdistribution';
import { DataCataglogueAPIService } from '../../services/data-cataglogue-api.service';
import * as L from "leaflet";
// declare let L;
import * as shp from "shpjs";
import * as toGeoJson from 'togeojson';
import JSZip from 'jszip';
import proj4 from "proj4";
import * as URLParse from 'url-parse';
import OlMap from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import WFS from 'ol/format/WFS';
import GML2 from 'ol/format/GML2';
import GML3 from 'ol/format/GML3';
import GML32 from 'ol/format/GML32';
import GeoJSONFormat from 'ol/format/GeoJSON';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { getCenter, isEmpty as isEmptyExtent } from 'ol/extent';
import { transformExtent } from 'ol/proj';
import { register } from 'ol/proj/proj4';

@Component({
  selector: 'ngx-remoteCatalogue-dialog',
  templateUrl: 'geojson-dialog.component.html',
  styleUrls: ['geojson-dialog.component.scss'],
})
export class GeoJsonDialogComponent {

  @Input() title: string;
  distribution: DCATDistribution;
  loading: boolean;
  type: string;
  convertedGeoJson: any;

  constructor(protected ref: NbDialogRef<GeoJsonDialogComponent>,
    private restApi: DataCataglogueAPIService,
    private http: HttpClient,
    private toastrService: NbToastrService,
) {
    this.registerOpenLayersProjections();
  }

  ngOnInit() {
    this.loading = true;
    this.openMap(this.distribution);
  }

  map: any;
  @ViewChild('geoJsonMap', { static: false }) geoJsonMap: ElementRef;

  private clearMap(): void {
    if (!this.map) {
      return;
    }

    if (this.map instanceof OlMap) {
      this.map.setTarget(null);
    } else {
      this.map.remove();
    }

    this.map = null;
  }

  private loadGeoJson(data: any, showError = true): boolean {
    this.loading = true;
    
    this.clearMap();

    const geoJsonData = this.normalizeGeoJsonData(data);
    if (!geoJsonData) {
      if (showError) {
        this.loading = false;
        this.toastrService.danger("Invalid GeoJSON file", "Error");
      }
      return false;
    }

    console.log(geoJsonData);
    globalThis.file_content = typeof data === 'string' ? data : JSON.stringify(data);

    // Creazione mappa Leaflet
    this.map = L.map(this.geoJsonMap.nativeElement).setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    const geoJsonLayer = L.geoJSON(geoJsonData, {
      onEachFeature: this.onEachFeature
    }).addTo(this.map);

    const bounds = geoJsonLayer.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds);
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          this.map.fitBounds(bounds);
        }
      }, 0);
    }

    this.loading = false;
    return true;
  }

  private normalizeGeoJsonData(data: any): GeoJSON.GeoJsonObject {
    let value = data;

    if (typeof value === 'string') {
      const parsed = this.parseGeoJsonText(value);
      if (parsed === undefined) {
        return null;
      }
      value = parsed;
    }

    if (Array.isArray(value)) {
      return {
        type: 'FeatureCollection',
        features: value
      } as GeoJSON.FeatureCollection;
    }

    if (value && typeof value === 'object') {
      if (this.isGeoJsonObject(value)) {
        return value as GeoJSON.GeoJsonObject;
      }

      if (Array.isArray(value.features)) {
        return {
          type: 'FeatureCollection',
          features: value.features
        } as GeoJSON.FeatureCollection;
      }

      const content = value.content || value.fileContent || value.data || value.result || value.body || value.value;
      if (content) {
        return this.normalizeGeoJsonData(content);
      }
    }

    return null;
  }

  private parseGeoJsonText(text: string): any {
    const rawText = text.trim();
    const parseAttempts = [
      rawText,
      this.normalizeGeoJsonText(rawText),
      this.extractGeoJsonText(rawText),
      this.extractGeoJsonText(this.normalizeGeoJsonText(rawText))
    ].filter(item => !!item);

    for (const item of parseAttempts) {
      try {
        const parsed = JSON.parse(item);
        return typeof parsed === 'string' ? this.parseGeoJsonText(parsed) : parsed;
      } catch (e) {}
    }

    return undefined;
  }

  private isGeoJsonObject(value: any): boolean {
    if (!value || typeof value !== 'object' || !value.type) {
      return false;
    }

    switch (value.type) {
      case 'FeatureCollection':
        return Array.isArray(value.features);
      case 'Feature':
        return Object.prototype.hasOwnProperty.call(value, 'geometry');
      case 'GeometryCollection':
        return Array.isArray(value.geometries);
      case 'Point':
      case 'MultiPoint':
      case 'LineString':
      case 'MultiLineString':
      case 'Polygon':
      case 'MultiPolygon':
        return Object.prototype.hasOwnProperty.call(value, 'coordinates');
      default:
        return false;
    }
  }

  private normalizeGeoJsonText(text: string): string {
    text = text.trim()
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\//g, '/');

    if (text.indexOf('{') < 0 && text.indexOf('&quot;') >= 0) {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      text = textarea.value.trim();
    }

    return text;
  }

  private extractGeoJsonText(text: string): string {
    const objectStart = text.indexOf('{');
    const objectEnd = text.lastIndexOf('}');
    if (objectStart >= 0 && objectEnd > objectStart) {
      return text.slice(objectStart, objectEnd + 1);
    }

    const arrayStart = text.indexOf('[');
    const arrayEnd = text.lastIndexOf(']');
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      return text.slice(arrayStart, arrayEnd + 1);
    }

    return '';
  }

  private loadGeoJsonFromExport(distribution: DCATDistribution): void {
    const urls = this.getDistributionUrls(distribution);
    if (urls.length === 0) {
      this.loading = false;
      this.toastrService.danger("No GeoJSON URL found for this distribution", "Error");
      return;
    }

    this.loadGeoJsonFromExportUrl(distribution, urls, 0);
  }

  private loadGeoJsonFromExportUrl(distribution: DCATDistribution, urls: string[], index: number): void {
    if (index >= urls.length) {
      this.loading = false;
      this.toastrService.danger("Could not load the file", "Error");
      return;
    }

    this.restApi.downloadGeoJSONFromUrl(distribution).subscribe(
      (res: string) => {
        this.loadGeoJson(res, true);
      },
      err => {
        this.loadGeoJsonFromExportUrl(this.getDistributionForUrl(distribution, urls[index + 1]), urls, index + 1);
      }
    )
  }

  private loadGeoJsonFromTextUrl(distribution: DCATDistribution, urls: string[], index: number): void {
    if (index >= urls.length) {
      this.loadGeoJsonFromExport(distribution);
      return;
    }

    this.restApi.downloadTextFromUri(this.getDistributionForUrl(distribution, urls[index])).subscribe(
      (res: string) => {
        if (!this.loadGeoJson(res, false)) {
          this.loadGeoJsonFromTextUrl(distribution, urls, index + 1);
        }
      },
      err => {
        this.loadGeoJsonFromTextUrl(distribution, urls, index + 1);
      }
    )
  }

  private getDistributionUrls(distribution: DCATDistribution): string[] {
    const urls = [distribution.downloadURL, distribution.accessURL]
      .filter(url => !!url && url.trim() !== '');

    return urls.filter((url, index) => urls.indexOf(url) === index);
  }

  private getDistributionForUrl(distribution: DCATDistribution, url: string): DCATDistribution {
    return Object.assign({}, distribution, {
      downloadURL: url || '',
      accessURL: ''
    });
  }

  private loadKml(kmlText: string, showError = true): boolean {
    const normalizedKmlText = this.normalizeKmlText(kmlText);
    const kml = new DOMParser().parseFromString(normalizedKmlText, 'text/xml');
    if (kml.querySelector('parsererror')) {
      if (showError) {
        this.loading = false;
        this.toastrService.danger("Invalid KML file", "Error");
      }
      return false;
    }

    const data = toGeoJson.kml(kml);
    if (!data.features || data.features.length === 0) {
      if (this.loadKmlRasterLayer(kml)) {
        return true;
      }

      if (showError) {
        this.loading = false;
        this.toastrService.danger("No map features found in the KML file", "Error");
      }
      return false;
    }

    this.loadGeoJson(JSON.stringify(data));
    return true;
  }

  private loadGml(gmlText: string, showError = true): boolean {
    const gmlTextNormalized = this.extractGmlPreviewText(this.normalizeXmlText(gmlText));
    const documentInfo = this.getGmlDocumentInfo(gmlTextNormalized);
    if (!documentInfo.previewable) {
      (globalThis as any).gml_preview_debug = documentInfo;
      console.warn('[GML preview diagnostics]', documentInfo);

      if (showError) {
        this.loading = false;
        this.toastrService.danger(documentInfo.message, "Error");
      }
      return false;
    }

    const features = this.readOpenLayersGmlFeatures(gmlTextNormalized);

    if (features.length === 0) {
      if (showError) {
        this.loading = false;
        this.toastrService.danger("No map features found in the GML file", "Error");
      }
      return false;
    }

    this.convertedGeoJson = new GeoJSONFormat().writeFeaturesObject(features, {
      featureProjection: 'EPSG:3857',
      dataProjection: 'EPSG:4326',
    });
    (globalThis as any).gml_converted_geojson = this.convertedGeoJson;
    this.logGmlDiagnostics(gmlTextNormalized, features);
    this.loadGeoJson(this.convertedGeoJson);
    return true;
  }

  private getGmlDocumentInfo(gmlText: string): any {
    try {
      const xml = new DOMParser().parseFromString(gmlText, 'text/xml');
      if (xml.querySelector('parsererror')) {
        return {
          previewable: false,
          kind: 'invalid-xml',
          rootElement: '',
          message: 'Invalid XML/GML file',
        };
      }

      const root = xml.documentElement;
      const rootElement = root ? this.getLocalName(root) : '';
      const hasGeometry = this.getGmlGeometryElements(xml).length > 0;
      const hasFeatureMembers = this.getGmlElements(xml, ['featureMember', 'featureMembers', 'member']).length > 0;

      if (this.getGmlElements(xml, ['ExceptionReport', 'ServiceExceptionReport']).length > 0) {
        return {
          previewable: false,
          kind: 'ogc-exception',
          rootElement: rootElement,
          message: 'The server returned an OGC error XML, not a GML feature file',
        };
      }

      if ([
        'WFS_Capabilities',
        'WMS_Capabilities',
        'Capabilities',
      ].indexOf(rootElement) >= 0) {
        return {
          previewable: false,
          kind: 'service-capabilities',
          rootElement: rootElement,
          message: 'The downloaded XML is a service capabilities document, not a GML feature file',
        };
      }

      if (!hasGeometry && !hasFeatureMembers) {
        return {
          previewable: false,
          kind: 'xml-without-gml-features',
          rootElement: rootElement,
          message: 'The downloaded XML does not contain previewable GML features',
        };
      }

      return {
        previewable: true,
        kind: 'gml-feature-document',
        rootElement: rootElement,
      };
    } catch (e) {
      return {
        previewable: false,
        kind: 'invalid-xml',
        rootElement: '',
        message: 'Invalid XML/GML file',
      };
    }
  }

  private readOpenLayersGmlFeatures(gmlText: string): any[] {
    const dataProjection = this.getOpenLayersGmlProjection(gmlText);
    const manuallyNormalizedFeatures = this.readManualGmlFeatures(gmlText);
    if (this.hasRenderableOpenLayersExtent(manuallyNormalizedFeatures)) {
      return manuallyNormalizedFeatures;
    }

    const readOptions = dataProjection ? [
      { dataProjection: dataProjection, featureProjection: 'EPSG:3857' },
      { featureProjection: 'EPSG:3857' },
    ] : [
      { featureProjection: 'EPSG:3857' },
    ];

    const formats = [
      new WFS(),
      new GML32(),
      new GML3(),
      new GML2(),
    ];

    for (const format of formats) {
      for (const options of readOptions) {
        try {
          const features = format.readFeatures(gmlText, options);

          if (features && features.length > 0 && this.hasRenderableOpenLayersExtent(features)) {
            return features;
          }
        } catch (e) {}
      }
    }

    return manuallyNormalizedFeatures;
  }

  private readManualGmlFeatures(gmlText: string): any[] {
    try {
      const gml = new DOMParser().parseFromString(gmlText, 'text/xml');
      if (gml.querySelector('parsererror')) {
        return [];
      }

      const features = this.gmlToFeatures(gml);
      if (features.length === 0) {
        return [];
      }

      return new GeoJSONFormat().readFeatures({
        type: 'FeatureCollection',
        features: features,
      }, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
    } catch (e) {
      return [];
    }
  }

  private registerOpenLayersProjections(): void {
    const definitions = {
      'EPSG:23029': '+proj=utm +zone=29 +ellps=intl +units=m +no_defs',
      'EPSG:23030': '+proj=utm +zone=30 +ellps=intl +units=m +no_defs',
      'EPSG:23031': '+proj=utm +zone=31 +ellps=intl +units=m +no_defs',
      'EPSG:25829': '+proj=utm +zone=29 +ellps=GRS80 +units=m +no_defs',
      'EPSG:25830': '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs',
      'EPSG:25831': '+proj=utm +zone=31 +ellps=GRS80 +units=m +no_defs',
      'EPSG:25832': '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs',
      'EPSG:31370': '+proj=lcc +lat_0=90 +lon_0=4.367486666666666 +lat_1=49.8333339 +lat_2=51.16666733333333 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +towgs84=-106.8686,52.2978,-103.7239,0.3366,-0.457,1.8422,-1.2747 +units=m +no_defs',
      'EPSG:3812': '+proj=lcc +lat_0=50.797815 +lon_0=4.359215833333333 +lat_1=49.83333333333334 +lat_2=51.16666666666666 +x_0=649328 +y_0=665262 +ellps=GRS80 +units=m +no_defs',
    };

    Object.keys(definitions).forEach(code => {
      if (!proj4.defs(code)) {
        proj4.defs(code, definitions[code]);
      }
    });

    register(proj4);
  }

  private getOpenLayersGmlProjection(gmlText: string): string {
    const match = (gmlText || '').match(/\bsrsName=["']([^"']+)["']/i);
    const epsg = match ? this.getEpsgCode(match[1]) : '';

    return epsg ? `EPSG:${epsg}` : '';
  }

  private logGmlDiagnostics(gmlText: string, features: any[]): void {
    const vectorSource = new VectorSource({
      features: features,
    });
    const extent3857 = vectorSource.getExtent();
    const extent4326 = this.getLonLatExtent(extent3857);
    const srsNames = this.getGmlSrsNames(gmlText);
    const diagnostics = {
      title: this.title,
      url: this.distribution && (this.distribution.downloadURL || this.distribution.accessURL),
      documentInfo: this.getGmlDocumentInfo(gmlText),
      srsNames: srsNames,
      detectedProjection: this.getOpenLayersGmlProjection(gmlText) || 'not declared',
      featureCount: features.length,
      geometryTypes: this.getOpenLayersGeometryTypes(features),
      sourceCoordinateSamples: this.getGmlSourceCoordinateSamples(gmlText),
      extent3857: extent3857,
      extentLonLat: extent4326,
      extentLooksValid: !!extent4326 && this.extentLooksLikeLonLat(extent4326),
    };

    (globalThis as any).gml_preview_debug = diagnostics;

    console.groupCollapsed('[GML preview diagnostics]', this.title || '');
    console.log(diagnostics);
    if (extent4326 && !diagnostics.extentLooksValid) {
      console.warn('GML extent is outside normal lon/lat ranges. CRS or axis order is probably wrong.', extent4326);
    }
    console.groupEnd();
  }

  private getLonLatExtent(extent: number[]): number[] {
    if (!extent || isEmptyExtent(extent) || !extent.every(value => isFinite(value))) {
      return null;
    }

    try {
      return transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
    } catch (e) {
      return null;
    }
  }

  private getGmlSrsNames(gmlText: string): string[] {
    const matches = (gmlText || '').match(/\bsrsName=["'][^"']+["']/ig) || [];
    return matches
      .map(match => match.replace(/\bsrsName=/i, '').replace(/["']/g, ''))
      .filter((value, index, values) => value && values.indexOf(value) === index)
      .slice(0, 10);
  }

  private getOpenLayersGeometryTypes(features: any[]): string[] {
    const types = (features || [])
      .map(feature => feature && feature.getGeometry ? feature.getGeometry() : null)
      .filter(geometry => !!geometry)
      .map(geometry => geometry.getType ? geometry.getType() : 'Unknown');

    return types.filter((value, index, values) => values.indexOf(value) === index);
  }

  private getGmlSourceCoordinateSamples(gmlText: string): any[] {
    try {
      const gml = new DOMParser().parseFromString(gmlText, 'text/xml');
      if (gml.querySelector('parsererror')) {
        return [];
      }

      const coordinateNodes = this.getGmlElements(gml, ['pos', 'posList', 'coordinates']);
      return coordinateNodes
        .slice(0, 8)
        .map(node => {
          const numbers = (node.textContent || '').trim().split(/[\s,]+/)
            .map(value => Number(value))
            .filter(value => !isNaN(value))
            .slice(0, 6);

          return {
            tag: this.getLocalName(node),
            srsName: this.getGmlSrsName(node) || 'not declared',
            sampleNumbers: numbers,
          };
        });
    } catch (e) {
      return [];
    }
  }

  private extentLooksLikeLonLat(extent: number[]): boolean {
    return extent &&
      extent[0] >= -180 &&
      extent[2] <= 180 &&
      extent[1] >= -90 &&
      extent[3] <= 90;
  }

  private hasRenderableOpenLayersExtent(features: any[]): boolean {
    if (!features || features.length === 0) {
      return false;
    }

    const source = new VectorSource({
      features: features,
    });
    const extent = source.getExtent();

    return extent &&
      !isEmptyExtent(extent) &&
      extent.every(value => isFinite(value)) &&
      extent[0] <= extent[2] &&
      extent[1] <= extent[3];
  }

  private loadOpenLayersFeatures(features: any[]): void {
    this.loading = true;
    this.clearMap();

    const vectorSource = new VectorSource({
      features: features,
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({
          color: '#3366ff',
          width: 2,
        }),
        fill: new Fill({
          color: 'rgba(51, 102, 255, 0.18)',
        }),
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({
            color: '#3366ff',
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 1,
          }),
        }),
      }),
    });
    vectorLayer.setZIndex(10);

    const markerSource = new VectorSource({
      features: this.createOpenLayersMarkerFeatures(features),
    });

    const markerLayer = new VectorLayer({
      source: markerSource,
      style: new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: '#e53935',
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 2,
          }),
        }),
      }),
    });
    markerLayer.setZIndex(20);

    this.map = new OlMap({
      target: this.geoJsonMap.nativeElement,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
        markerLayer,
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });

    const extent = vectorSource.getExtent();
    if (!isEmptyExtent(extent)) {
      this.map.getView().fit(extent, {
        padding: [32, 32, 32, 32],
        maxZoom: 18,
      });
    }

    this.loading = false;
  }

  private createOpenLayersMarkerFeatures(features: any[]): any[] {
    return (features || [])
      .map(feature => {
        const geometry = feature && feature.getGeometry ? feature.getGeometry() : null;
        if (!geometry) {
          return null;
        }

        const type = geometry.getType ? geometry.getType() : '';
        let coordinate = null;

        if (type === 'Point') {
          coordinate = geometry.getCoordinates();
        } else if (type === 'MultiPoint') {
          const coordinates = geometry.getCoordinates();
          coordinate = coordinates && coordinates.length > 0 ? coordinates[0] : null;
        } else {
          const extent = geometry.getExtent ? geometry.getExtent() : null;
          coordinate = extent && !isEmptyExtent(extent) ? getCenter(extent) : null;
        }

        return coordinate ? new Feature({
          geometry: new Point(coordinate),
        }) : null;
      })
      .filter(feature => !!feature);
  }

  private loadGmlFromUrl(distribution: DCATDistribution): void {
    const urls = this.getDistributionUrls(distribution);
    if (urls.length === 0) {
      this.loading = false;
      this.toastrService.danger("No GML URL found for this distribution", "Error");
      return;
    }

    this.loadGmlFromTextUrl(distribution, urls, 0);
  }

  private loadGmlFromTextUrl(distribution: DCATDistribution, urls: string[], index: number): void {
    if (index >= urls.length) {
      this.loading = false;
      this.toastrService.danger("Could not render the GML file", "Error");
      return;
    }

    const currentDistribution = this.getDistributionForUrl(distribution, urls[index]);
    this.restApi.downloadTextFromUri(currentDistribution).subscribe(
      (res: string) => {
        if (!this.loadGml(res, false)) {
          this.loadGmlFromDirectUrl(distribution, urls, index);
        }
      },
      err => {
        this.loadGmlFromDirectUrl(distribution, urls, index);
      }
    )
  }

  private loadGmlFromDirectUrl(distribution: DCATDistribution, urls: string[], index: number): void {
    const url = urls[index];
    this.http.get(url, { responseType: 'text' }).subscribe(
      (res: string) => {
        if (!this.loadGml(res, false)) {
          this.loadGmlFromTextUrl(distribution, urls, index + 1);
        }
      },
      err => {
        this.loadGmlFromTextUrl(distribution, urls, index + 1);
      }
    )
  }

  private gmlToFeatures(gml: Document): GeoJSON.Feature[] {
    const features = [];
    const featureMembers = this.getGmlFeatureMembers(gml);

    if (featureMembers.length > 0) {
      featureMembers.forEach(member => {
        const geometry = this.findGmlGeometry(member);
        if (geometry) {
          features.push({
            type: 'Feature',
            properties: this.extractGmlProperties(member),
            geometry: geometry
          });
        }
      });
      return features;
    }

    this.getGmlGeometryElements(gml).forEach(element => {
      const geometry = this.parseGmlGeometry(element);
      if (geometry) {
        features.push({
          type: 'Feature',
          properties: {},
          geometry: geometry
        });
      }
    });

    return features;
  }

  private findGmlGeometry(root: Element): GeoJSON.Geometry {
    const geometryElement = this.getGmlGeometryElements(root)[0];
    return geometryElement ? this.parseGmlGeometry(geometryElement) : null;
  }

  private getGmlGeometryElements(root: Document | Element): Element[] {
    return this.getGmlElements(root, [
      'Point',
      'LineString',
      'Curve',
      'Polygon',
      'Surface',
      'MultiPoint',
      'MultiLineString',
      'MultiCurve',
      'MultiPolygon',
      'MultiSurface',
      'MultiGeometry',
      'GeometryCollection',
      'Envelope',
      'Box',
      'PolygonPatch'
    ]);
  }

  private parseGmlGeometry(element: Element): GeoJSON.Geometry {
    const name = this.getLocalName(element);

    switch (name) {
      case 'Point':
        return this.parseGmlPoint(element);
      case 'LineString':
      case 'Curve':
        return this.parseGmlLineString(element);
      case 'Polygon':
      case 'Surface':
        return this.parseGmlPolygon(element);
      case 'MultiPoint':
        return this.parseGmlMultiPoint(element);
      case 'MultiLineString':
      case 'MultiCurve':
        return this.parseGmlMultiLineString(element);
      case 'MultiPolygon':
      case 'MultiSurface':
        return this.parseGmlMultiPolygon(element);
      case 'MultiGeometry':
      case 'GeometryCollection':
        return this.parseGmlGeometryCollection(element);
      case 'Envelope':
      case 'Box':
        return this.parseGmlEnvelope(element);
      case 'PolygonPatch':
        return this.parseGmlPolygon(element);
      default:
        return null;
    }
  }

  private parseGmlPoint(element: Element): GeoJSON.Point {
    const coordinates = this.readGmlCoordinateList(element);
    return coordinates.length > 0 ? { type: 'Point', coordinates: coordinates[0] } : null;
  }

  private parseGmlLineString(element: Element): GeoJSON.LineString {
    const lineElement = this.getGmlElements(element, ['LineStringSegment', 'LineString'])[0] || element;
    const coordinates = this.readGmlCoordinateList(lineElement);
    return coordinates.length >= 2 ? { type: 'LineString', coordinates: coordinates } : null;
  }

  private parseGmlPolygon(element: Element): GeoJSON.Polygon {
    const rings = [];
    let ringElements = this.getGmlElements(element, ['LinearRing', 'Ring']);
    if (ringElements.length === 0) {
      ringElements = this.getGmlElements(element, ['exterior', 'interior']);
    }

    if (ringElements.length > 0) {
      ringElements.forEach(ring => {
        const coordinates = this.readGmlCoordinateList(ring);
        if (coordinates.length >= 4) {
          rings.push(coordinates);
        }
      });
    } else {
      const coordinates = this.readGmlCoordinateList(element);
      if (coordinates.length >= 4) {
        rings.push(coordinates);
      }
    }

    return rings.length > 0 ? { type: 'Polygon', coordinates: rings } : null;
  }

  private parseGmlMultiPoint(element: Element): GeoJSON.MultiPoint {
    const points = this.getGmlElements(element, ['Point'])
      .map(point => this.parseGmlPoint(point))
      .filter(point => !!point)
      .map(point => point.coordinates);

    return points.length > 0 ? { type: 'MultiPoint', coordinates: points } : null;
  }

  private parseGmlMultiLineString(element: Element): GeoJSON.MultiLineString {
    const lines = this.getGmlElements(element, ['LineString', 'Curve'])
      .map(line => this.parseGmlLineString(line))
      .filter(line => !!line)
      .map(line => line.coordinates);

    return lines.length > 0 ? { type: 'MultiLineString', coordinates: lines } : null;
  }

  private parseGmlMultiPolygon(element: Element): GeoJSON.MultiPolygon {
    const polygons = this.getGmlElements(element, ['Polygon', 'Surface', 'PolygonPatch'])
      .map(polygon => this.parseGmlPolygon(polygon))
      .filter(polygon => !!polygon)
      .map(polygon => polygon.coordinates);

    return polygons.length > 0 ? { type: 'MultiPolygon', coordinates: polygons } : null;
  }

  private parseGmlGeometryCollection(element: Element): GeoJSON.GeometryCollection {
    const geometries = this.getGmlGeometryElements(element)
      .filter(geometryElement => geometryElement !== element)
      .map(geometryElement => this.parseGmlGeometry(geometryElement))
      .filter(geometry => !!geometry);

    return geometries.length > 0 ? { type: 'GeometryCollection', geometries: geometries } : null;
  }

  private parseGmlEnvelope(element: Element): GeoJSON.Polygon {
    const lowerCorner = this.getGmlElements(element, ['lowerCorner'])[0];
    const upperCorner = this.getGmlElements(element, ['upperCorner'])[0];
    const srsName = this.getGmlSrsName(element);

    if (!lowerCorner || !upperCorner) {
      return null;
    }

    const lower = this.parseGmlNumberList(lowerCorner.textContent || '', Number(lowerCorner.getAttribute('srsDimension')) || 2, srsName || this.getGmlSrsName(lowerCorner))[0];
    const upper = this.parseGmlNumberList(upperCorner.textContent || '', Number(upperCorner.getAttribute('srsDimension')) || 2, srsName || this.getGmlSrsName(upperCorner))[0];

    if (!lower || !upper) {
      return null;
    }

    const west = Math.min(lower[0], upper[0]);
    const east = Math.max(lower[0], upper[0]);
    const south = Math.min(lower[1], upper[1]);
    const north = Math.max(lower[1], upper[1]);

    return {
      type: 'Polygon',
      coordinates: [[
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south]
      ]]
    };
  }

  private readGmlCoordinateList(element: Element): number[][] {
    const srsName = this.getGmlSrsName(element);
    const posList = this.getGmlElements(element, ['posList'])[0];
    if (posList && posList.textContent) {
      return this.parseGmlNumberList(posList.textContent, Number(posList.getAttribute('srsDimension')) || 2, srsName || this.getGmlSrsName(posList));
    }

    const positions = this.getGmlElements(element, ['pos']);
    if (positions.length > 0) {
      return positions
        .map(position => this.parseGmlNumberList(position.textContent || '', Number(position.getAttribute('srsDimension')) || 2, srsName || this.getGmlSrsName(position))[0])
        .filter(position => !!position);
    }

    const coordinates = this.getGmlElements(element, ['coordinates'])[0];
    if (coordinates && coordinates.textContent) {
      return coordinates.textContent.trim().split(/\s+/)
        .map(pair => pair.split(',').map(value => Number(value)))
        .filter(pair => pair.length >= 2 && pair.every(value => !isNaN(value)))
        .map(pair => this.normalizeGmlCoordinate(pair[0], pair[1], srsName || this.getGmlSrsName(coordinates)));
    }

    return [];
  }

  private getGmlFeatureMembers(gml: Document): Element[] {
    const members = this.getGmlElements(gml, ['featureMember']);
    const featureMembers = this.getGmlElements(gml, ['featureMembers']);

    featureMembers.forEach(container => {
      Array.from(container.children).forEach(child => {
        if (this.getGmlGeometryElements(child).length > 0 || this.parseGmlGeometry(child)) {
          members.push(child);
        }
      });
    });

    return members;
  }

  private parseGmlNumberList(value: string, dimension: number, srsName = ''): number[][] {
    const numbers = (value || '').trim().split(/\s+/).map(item => Number(item)).filter(item => !isNaN(item));
    const coordinates = [];

    for (let i = 0; i + 1 < numbers.length; i += dimension) {
      coordinates.push(this.normalizeGmlCoordinate(numbers[i], numbers[i + 1], srsName));
    }

    return coordinates;
  }

  private normalizeGmlCoordinate(first: number, second: number, srsName = ''): number[] {
    const epsg = this.getEpsgCode(srsName);
    if (epsg) {
      const transformed = this.transformProjectedCoordinate(first, second, epsg);
      if (transformed) {
        return transformed;
      }

      if (epsg === '4326' || epsg === '4258') {
        return this.normalizeGeographicGmlCoordinate(first, second, srsName);
      }
    }

    if (this.isUnambiguouslyLatLon(first, second)) {
      return [second, first];
    }

    return [first, second];
  }

  private normalizeGeographicGmlCoordinate(first: number, second: number, srsName = ''): number[] {
    if (this.usesLatLonAxisOrder(srsName)) {
      return [second, first];
    }

    if (this.looksLikeEuropeanLatLon(first, second)) {
      return [second, first];
    }

    if (this.looksLikeLonLat(first, second)) {
      return [first, second];
    }

    return [first, second];
  }

  private getGmlSrsName(element: Element): string {
    let current: Element = element;
    while (current) {
      const srsName = current.getAttribute('srsName');
      if (srsName) {
        return srsName;
      }
      current = current.parentElement;
    }

    return '';
  }

  private getEpsgCode(srsName: string): string {
    const match = (srsName || '').match(/EPSG[/:]*([0-9]+)$/i) || (srsName || '').match(/epsg\.xml#([0-9]+)$/i);
    return match ? match[1] : '';
  }

  private usesLatLonAxisOrder(srsName = ''): boolean {
    const lowerSrs = (srsName || '').toLowerCase();
    return lowerSrs.indexOf('def/crs') >= 0 ||
      lowerSrs.indexOf('urn:ogc:def:crs') >= 0 ||
      lowerSrs.indexOf('epsg.xml#') >= 0;
  }

  private isUnambiguouslyLatLon(first: number, second: number): boolean {
    return Math.abs(first) <= 90 && Math.abs(second) > 90 && Math.abs(second) <= 180;
  }

  private looksLikeEuropeanLatLon(first: number, second: number): boolean {
    return first >= 25 && first <= 75 && second >= -35 && second <= 45;
  }

  private looksLikeLonLat(first: number, second: number): boolean {
    return first >= -35 && first <= 45 && second >= 25 && second <= 75;
  }

  private transformProjectedCoordinate(first: number, second: number, epsg: string): number[] {
    const source = this.getProj4Definition(epsg, first);
    if (!source) {
      return null;
    }

    try {
      const normal = proj4(source, 'EPSG:4326', [first, second]);
      const swapped = proj4(source, 'EPSG:4326', [second, first]);
      return this.pickBestLonLatCoordinate(normal, swapped);
    } catch (e) {
      return null;
    }
  }

  private pickBestLonLatCoordinate(firstCandidate: number[], secondCandidate: number[]): number[] {
    const candidates = [firstCandidate, secondCandidate].filter(coordinate =>
      coordinate &&
      coordinate.length >= 2 &&
      coordinate.every(value => isFinite(value))
    );

    if (candidates.length === 0) {
      return null;
    }

    const europeanCandidate = candidates.find(coordinate => this.looksLikeLonLat(coordinate[0], coordinate[1]));
    if (europeanCandidate) {
      return europeanCandidate;
    }

    const validCandidate = candidates.find(coordinate =>
      coordinate[0] >= -180 &&
      coordinate[0] <= 180 &&
      coordinate[1] >= -90 &&
      coordinate[1] <= 90
    );

    return validCandidate || candidates[0];
  }

  private getProj4Definition(epsg: string, x: number): string {
    switch (epsg) {
      case '3857':
      case '900913':
        return 'EPSG:3857';
      case '23029':
        return '+proj=utm +zone=29 +ellps=intl +units=m +no_defs';
      case '23030':
        return '+proj=utm +zone=30 +ellps=intl +units=m +no_defs';
      case '23031':
        return '+proj=utm +zone=31 +ellps=intl +units=m +no_defs';
      case '25829':
        return '+proj=utm +zone=29 +ellps=GRS80 +units=m +no_defs';
      case '25830':
        return '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs';
      case '25831':
        return '+proj=utm +zone=31 +ellps=GRS80 +units=m +no_defs';
      case '25832':
        return '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs';
      case '31370':
        return '+proj=lcc +lat_0=90 +lon_0=4.367486666666666 +lat_1=49.8333339 +lat_2=51.16666733333333 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +towgs84=-106.8686,52.2978,-103.7239,0.3366,-0.457,1.8422,-1.2747 +units=m +no_defs';
      case '3812':
        return '+proj=lcc +lat_0=50.797815 +lon_0=4.359215833333333 +lat_1=49.83333333333334 +lat_2=51.16666666666666 +x_0=649328 +y_0=665262 +ellps=GRS80 +units=m +no_defs';
      default:
        if (/^326\d\d$/.test(epsg)) {
          return `+proj=utm +zone=${epsg.slice(3)} +datum=WGS84 +units=m +no_defs`;
        }
        if (/^258\d\d$/.test(epsg)) {
          return `+proj=utm +zone=${epsg.slice(3)} +ellps=GRS80 +units=m +no_defs`;
        }
        return '';
    }
  }

  private extractGmlProperties(member: Element): any {
    const properties = {};
    Array.from(member.children).forEach(child => {
      if (this.getGmlGeometryElements(child).length > 0 || this.parseGmlGeometry(child)) {
        return;
      }

      const name = this.getLocalName(child);
      const value = (child.textContent || '').trim();
      if (name && value) {
        properties[name] = value;
      }
    });

    return properties;
  }

  private getGmlElements(root: Document | Element, names: string[]): Element[] {
    return Array.from(root.getElementsByTagName('*')).filter(element => names.indexOf(this.getLocalName(element)) >= 0);
  }

  private getLocalName(element: Element): string {
    return element.localName || element.nodeName.split(':').pop();
  }

  private extractGmlPreviewText(text: string): string {
    const directGml = this.extractDirectGmlFragment(text);
    if (directGml) {
      return directGml;
    }

    const embeddedGml = this.extractEmbeddedEscapedGml(text);
    if (embeddedGml) {
      return embeddedGml;
    }

    try {
      const xml = new DOMParser().parseFromString(text, 'text/xml');
      if (xml.querySelector('parsererror')) {
        return text;
      }

      const serializer = new XMLSerializer();
      const featureCollection = this.getGmlElements(xml, ['FeatureCollection'])[0];
      if (featureCollection) {
        return serializer.serializeToString(featureCollection);
      }

      const members = this.getGmlElements(xml, ['featureMember', 'member'])
        .filter(member => this.getGmlGeometryElements(member).length > 0);
      if (members.length > 0) {
        return this.wrapGmlMembers(members.map(member => serializer.serializeToString(member)).join(''));
      }

      const featureMembers = this.getGmlElements(xml, ['featureMembers'])[0];
      if (featureMembers && this.getGmlGeometryElements(featureMembers).length > 0) {
        return this.wrapGmlMembers(serializer.serializeToString(featureMembers));
      }

      const geometryElements = this.getGmlGeometryElements(xml);
      if (geometryElements.length > 0) {
        const geometryFragments = geometryElements
          .filter(element => !this.hasGmlGeometryAncestor(element))
          .map(element => `<gml:featureMember><feature>${serializer.serializeToString(element)}</feature></gml:featureMember>`)
          .join('');

        return geometryFragments ? this.wrapGmlMembers(geometryFragments) : text;
      }
    } catch (e) {}

    return text;
  }

  private extractDirectGmlFragment(text: string): string {
    const featureCollection = this.extractXmlElementText(text, 'FeatureCollection');
    if (featureCollection) {
      return featureCollection;
    }

    const members = this.extractAllXmlElementTexts(text, 'featureMember')
      .concat(this.extractAllXmlElementTexts(text, 'member'));
    if (members.length > 0) {
      return this.wrapGmlMembers(members.join(''));
    }

    return '';
  }

  private extractEmbeddedEscapedGml(text: string): string {
    if (text.indexOf('&lt;') < 0) {
      return '';
    }

    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    const decoded = textarea.value.trim();

    return decoded !== text ? this.extractDirectGmlFragment(decoded) || this.extractGmlPreviewText(decoded) : '';
  }

  private extractXmlElementText(text: string, localName: string): string {
    const fragments = this.extractAllXmlElementTexts(text, localName);
    return fragments.length > 0 ? fragments[0] : '';
  }

  private extractAllXmlElementTexts(text: string, localName: string): string[] {
    const fragments = [];
    const openPattern = new RegExp(`<([\\w.-]+:)?${localName}\\b`, 'ig');
    let match: RegExpExecArray;

    while ((match = openPattern.exec(text)) !== null) {
      const prefix = match[1] || '';
      const tagName = `${prefix}${localName}`;
      const start = match.index;
      const openEnd = text.indexOf('>', start);
      if (openEnd < 0) {
        continue;
      }

      if (text.charAt(openEnd - 1) === '/') {
        fragments.push(text.slice(start, openEnd + 1));
        continue;
      }

      const closeTag = `</${tagName}>`;
      const end = text.indexOf(closeTag, openEnd + 1);
      if (end >= 0) {
        fragments.push(text.slice(start, end + closeTag.length));
      }
    }

    return fragments;
  }

  private wrapGmlMembers(content: string): string {
    return `<gml:FeatureCollection xmlns:gml="http://www.opengis.net/gml">${content}</gml:FeatureCollection>`;
  }

  private hasGmlGeometryAncestor(element: Element): boolean {
    let current = element.parentElement;
    while (current) {
      if (this.getGmlGeometryElements(current).indexOf(element) >= 0 && this.getLocalName(current) !== 'feature') {
        const currentName = this.getLocalName(current);
        if ([
          'Point',
          'LineString',
          'Curve',
          'Polygon',
          'Surface',
          'MultiPoint',
          'MultiLineString',
          'MultiCurve',
          'MultiPolygon',
          'MultiSurface',
          'MultiGeometry',
          'GeometryCollection',
          'Envelope',
          'Box',
          'PolygonPatch'
        ].indexOf(currentName) >= 0) {
          return true;
        }
      }
      current = current.parentElement;
    }

    return false;
  }

  private normalizeXmlText(value: any): string {
    let text = typeof value === 'string' ? value : JSON.stringify(value);
    text = text.trim();

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string') {
        text = parsed.trim();
      } else if (parsed && typeof parsed === 'object') {
        text = (parsed.content || parsed.fileContent || parsed.data || parsed.result || parsed.body || text).toString().trim();
      }
    } catch (e) {}

    text = text
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\//g, '/');

    if (text.indexOf('<') < 0 && text.indexOf('&lt;') >= 0) {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      text = textarea.value.trim();
    }

    const xmlStart = text.indexOf('<?xml');
    const gmlStarts = [
      text.search(/<[\w-]*:?FeatureCollection\b/i),
      text.search(/<[\w-]*:?featureMember\b/i),
      text.search(/<[\w-]*:?Point\b/i),
      text.search(/<[\w-]*:?LineString\b/i),
      text.search(/<[\w-]*:?Polygon\b/i),
      text.search(/<[\w-]*:?Multi/i),
    ].filter(index => index >= 0);
    const tagStart = gmlStarts.length > 0 ? Math.min(...gmlStarts) : text.indexOf('<');
    const start = xmlStart >= 0 && (tagStart < 0 || xmlStart <= tagStart) ? xmlStart : tagStart;

    return start > 0 ? text.slice(start).trim() : text.trim();
  }

  private loadKmlRasterLayer(kml: Document): boolean {
    const networkLinkHref = this.getNetworkLinkHref(kml);
    if (networkLinkHref && this.isWmsUrl(networkLinkHref)) {
      this.loadNetworkLinkWms(networkLinkHref, kml);
      return true;
    }

    const groundOverlay = kml.getElementsByTagName('GroundOverlay')[0];
    if (!groundOverlay) {
      return false;
    }

    const iconHref = this.getKmlNodeText(groundOverlay, 'Icon href');
    const north = Number(this.getKmlNodeText(groundOverlay, 'LatLonBox north'));
    const south = Number(this.getKmlNodeText(groundOverlay, 'LatLonBox south'));
    const east = Number(this.getKmlNodeText(groundOverlay, 'LatLonBox east'));
    const west = Number(this.getKmlNodeText(groundOverlay, 'LatLonBox west'));

    if (!iconHref || [north, south, east, west].some(value => isNaN(value))) {
      return false;
    }

    const bounds: L.LatLngBoundsExpression = [[south, west], [north, east]];
    this.loadImageOverlay(iconHref, bounds);
    return true;
  }

  private getNetworkLinkHref(kml: Document): string {
    return this.getKmlNodeText(kml, 'NetworkLink Url href') ||
      this.getKmlNodeText(kml, 'NetworkLink Link href') ||
      this.getKmlNodeText(kml, 'NetworkLink href');
  }

  private loadNetworkLinkWms(href: string, kml: Document): void {
    const parsedUrl = new URLParse(href, true);
    const query = parsedUrl.query || {};
    const layers = this.getQueryParam(query, ['layers']);
    const styles = this.getQueryParam(query, ['styles']) || '';
    const version = this.getQueryParam(query, ['version']) || '1.1.1';

    if (!layers) {
      this.loading = false;
      this.toastrService.danger("No WMS layer found in the KML NetworkLink", "Error");
      return;
    }

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map(this.geoJsonMap.nativeElement);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(this.map);

    const lookAt = this.getKmlCenter(kml);
    if (lookAt) {
      this.map.setView(lookAt, 9);
    } else {
      this.map.setView([0, 0], 2);
    }

    const serviceUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
    L.tileLayer.wms(serviceUrl, {
      layers: layers,
      styles: styles,
      format: 'image/png',
      transparent: true,
      version: version,
      attribution: this.distribution && this.distribution.title ? this.distribution.title : 'WMS'
    }).addTo(this.map);

    this.loading = false;
  }

  private loadImageOverlay(imageUrl: string, bounds: L.LatLngBoundsExpression): void {
    if (this.map) {
      this.map.remove();
    }

    this.map = L.map(this.geoJsonMap.nativeElement).fitBounds(bounds);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(this.map);

    L.imageOverlay(imageUrl, bounds).addTo(this.map);
    this.loading = false;
  }

  private extractKmlWmsOptions(kml: Document): any {
    return {
      layers: this.getKmlWmsLayers(kml),
      bounds: this.getKmlBounds(kml),
      center: this.getKmlCenter(kml),
      styles: this.getKmlExtendedValue(kml, ['styles', 'style']),
      format: this.getKmlExtendedValue(kml, ['format']),
      transparent: this.getKmlExtendedValue(kml, ['transparent']),
      version: this.getKmlExtendedValue(kml, ['version'])
    };
  }

  private getKmlWmsLayers(kml: Document): string {
    return this.getKmlExtendedValue(kml, ['layers', 'layer', 'wms:layers', 'wms_layer', 'wmslayer']) ||
      this.getFirstKmlText(kml, ['layers', 'layer', 'Layer']);
  }

  private getKmlBounds(kml: Document): L.LatLngBoundsExpression {
    const box = kml.getElementsByTagName('LatLonBox')[0] ||
      kml.getElementsByTagName('LatLonAltBox')[0] ||
      kml.getElementsByTagName('Region')[0];

    if (!box) {
      return null;
    }

    const north = Number(this.getKmlNodeText(box, 'north'));
    const south = Number(this.getKmlNodeText(box, 'south'));
    const east = Number(this.getKmlNodeText(box, 'east'));
    const west = Number(this.getKmlNodeText(box, 'west'));

    if ([north, south, east, west].some(value => isNaN(value))) {
      return null;
    }

    return [[south, west], [north, east]];
  }

  private getKmlCenter(kml: Document): L.LatLngExpression {
    const lookAt = kml.getElementsByTagName('LookAt')[0] || kml.getElementsByTagName('Camera')[0];
    if (!lookAt) {
      return null;
    }

    const latitude = Number(this.getKmlNodeText(lookAt, 'latitude'));
    const longitude = Number(this.getKmlNodeText(lookAt, 'longitude'));

    if (isNaN(latitude) || isNaN(longitude)) {
      return null;
    }

    return [latitude, longitude];
  }

  private getKmlExtendedValue(kml: Document, names: string[]): string {
    const dataNodes = Array.from(kml.getElementsByTagName('Data'));
    for (const dataNode of dataNodes) {
      const name = (dataNode.getAttribute('name') || '').toLowerCase();
      if (names.map(item => item.toLowerCase()).indexOf(name) >= 0) {
        const value = this.getKmlNodeText(dataNode, 'value');
        if (value) {
          return value;
        }
      }
    }

    const simpleDataNodes = Array.from(kml.getElementsByTagName('SimpleData'));
    for (const dataNode of simpleDataNodes) {
      const name = (dataNode.getAttribute('name') || '').toLowerCase();
      if (names.map(item => item.toLowerCase()).indexOf(name) >= 0 && dataNode.textContent) {
        return dataNode.textContent.trim();
      }
    }

    return '';
  }

  private getFirstKmlText(kml: Document, tagNames: string[]): string {
    for (const tagName of tagNames) {
      const node = kml.getElementsByTagName(tagName)[0];
      if (node && node.textContent && node.textContent.trim()) {
        return node.textContent.trim();
      }
    }

    return '';
  }

  private getKmlNodeText(root: Document | Element, path: string): string {
    const parts = path.split(' ');
    let current: Document | Element = root;

    for (const part of parts) {
      const element = current.getElementsByTagName(part)[0];
      if (!element) {
        return '';
      }
      current = element;
    }

    return (current.textContent || '').trim();
  }

  private normalizeKmlText(value: any): string {
    let text = typeof value === 'string' ? value : JSON.stringify(value);
    text = text.trim();

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string') {
        text = parsed.trim();
      } else if (parsed && typeof parsed === 'object') {
        text = (parsed.content || parsed.fileContent || parsed.data || parsed.result || text).toString().trim();
      }
    } catch (e) {}

    text = text
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\//g, '/');

    if (text.indexOf('<kml') < 0 && text.indexOf('&lt;kml') >= 0) {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      text = textarea.value.trim();
    }

    const xmlStart = text.indexOf('<?xml');
    const kmlStart = text.toLowerCase().indexOf('<kml');
    const start = xmlStart >= 0 ? xmlStart : kmlStart;

    if (start > 0) {
      text = text.slice(start);
    }

    const kmlEnd = text.toLowerCase().lastIndexOf('</kml>');
    if (kmlEnd >= 0) {
      text = text.slice(0, kmlEnd + '</kml>'.length);
    }

    return text.trim();
  }

  private loadKmlFromExport(distribution: DCATDistribution): void {
    if (!distribution.downloadURL && !distribution.accessURL) {
      this.loading = false;
      this.toastrService.danger("No KML URL found for this distribution", "Error");
      return;
    }

    this.restApi.downloadKMLFromUrl(distribution).subscribe(
      (res: string) => {
        this.loadKml(res, true);
      },
      err => {
        this.loading = false;
        this.toastrService.danger("Could not load the file", "Error");
      }
    )
  }

  private loadWms(distribution: DCATDistribution): void {
    const url = distribution.downloadURL || distribution.accessURL || '';
    if (!url) {
      this.loading = false;
      this.toastrService.danger("No WMS URL found for this distribution", "Error");
      return;
    }

    const parsedUrl = new URLParse(url, true);
    const layers = this.getQueryParam(parsedUrl.query || {}, ['layers', 'layer']);
    if (layers) {
      this.loadWmsUrl(url, distribution.title);
      return;
    }

    this.loadWmsCapabilities(distribution, url);
  }

  private loadWmsCapabilities(distribution: DCATDistribution, url: string): void {
    this.restApi.downloadTextFromUri(distribution).subscribe(
      (res: string) => {
        if (!this.loadWmsFromCapabilitiesText(res, url, distribution.title, false)) {
          this.loadWmsCapabilitiesDirect(url, distribution.title);
        }
      },
      () => this.loadWmsCapabilitiesDirect(url, distribution.title)
    );
  }

  private loadWmsCapabilitiesDirect(url: string, title = 'WMS'): void {
    const capabilitiesUrl = this.getWmsCapabilitiesUrl(url);
    this.http.get(capabilitiesUrl, { responseType: 'text' }).subscribe(
      (res: string) => {
        if (!this.loadWmsFromCapabilitiesText(res, url, title, true)) {
          this.loading = false;
          this.toastrService.danger("Could not read WMS capabilities", "Error");
        }
      },
      () => {
        this.loading = false;
        this.toastrService.danger("Could not load the file", "Error");
      }
    );
  }

  private loadWmsFromCapabilitiesText(text: string, fallbackUrl: string, title = 'WMS', showError = true): boolean {
    const normalizedText = this.normalizeXmlText(text);
    const capabilities = new DOMParser().parseFromString(normalizedText, 'text/xml');
    const rootName = capabilities.documentElement ? this.getLocalName(capabilities.documentElement) : '';

    if (capabilities.querySelector('parsererror') || rootName.toLowerCase().indexOf('capabilities') < 0) {
      if (showError) {
        this.toastrService.danger("Invalid WMS capabilities XML", "Error");
      }
      return false;
    }

    const options = this.extractWmsCapabilitiesOptions(capabilities);
    if (!options.layers) {
      if (showError) {
        this.toastrService.danger("No WMS layer found in capabilities", "Error");
      }
      return false;
    }

    this.loadWmsUrl(options.serviceUrl || fallbackUrl, title, options);
    return true;
  }

  private extractWmsCapabilitiesOptions(capabilities: Document): any {
    const serviceUrl = this.getWmsGetMapUrl(capabilities);
    const version = capabilities.documentElement ? capabilities.documentElement.getAttribute('version') || '1.1.1' : '1.1.1';
    const layer = this.getFirstNamedWmsLayer(capabilities);

    return {
      serviceUrl,
      version,
      layers: layer.name,
      title: layer.title,
      bounds: layer.bounds,
      styles: '',
      format: this.getPreferredWmsImageFormat(capabilities),
      transparent: true,
    };
  }

  private getWmsGetMapUrl(capabilities: Document): string {
    const onlineResources = Array.from(capabilities.getElementsByTagName('*'))
      .filter(element =>
        this.getLocalName(element) === 'OnlineResource' &&
        this.hasWmsGetMapAncestor(element)
      );

    for (const resource of onlineResources) {
      const href = resource.getAttribute('xlink:href') || resource.getAttribute('href');
      if (href) {
        return href;
      }
    }

    return '';
  }

  private hasWmsGetMapAncestor(element: Element): boolean {
    let current = element.parentElement;
    while (current) {
      if (this.getLocalName(current) === 'GetMap') {
        return true;
      }
      current = current.parentElement;
    }

    return false;
  }

  private getFirstNamedWmsLayer(capabilities: Document): any {
    const layers = Array.from(capabilities.getElementsByTagName('*'))
      .filter(element => this.getLocalName(element) === 'Layer');

    for (const layer of layers) {
      const name = this.getDirectChildText(layer, 'Name');
      if (!name) {
        continue;
      }

      return {
        name,
        title: this.getDirectChildText(layer, 'Title') || name,
        bounds: this.getWmsLayerBounds(layer),
      };
    }

    return { name: '', title: '', bounds: null };
  }

  private getWmsLayerBounds(layer: Element): L.LatLngBoundsExpression {
    const geographicBox = Array.from(layer.getElementsByTagName('*'))
      .find(element => ['EX_GeographicBoundingBox', 'LatLonBoundingBox'].indexOf(this.getLocalName(element)) >= 0);

    if (!geographicBox) {
      return null;
    }

    if (this.getLocalName(geographicBox) === 'LatLonBoundingBox') {
      const west = Number(geographicBox.getAttribute('minx'));
      const south = Number(geographicBox.getAttribute('miny'));
      const east = Number(geographicBox.getAttribute('maxx'));
      const north = Number(geographicBox.getAttribute('maxy'));
      return [west, south, east, north].every(value => !isNaN(value)) ? [[south, west], [north, east]] : null;
    }

    const west = Number(this.getFirstChildText(geographicBox, ['westBoundLongitude']));
    const east = Number(this.getFirstChildText(geographicBox, ['eastBoundLongitude']));
    const south = Number(this.getFirstChildText(geographicBox, ['southBoundLatitude']));
    const north = Number(this.getFirstChildText(geographicBox, ['northBoundLatitude']));

    return [west, south, east, north].every(value => !isNaN(value)) ? [[south, west], [north, east]] : null;
  }

  private getPreferredWmsImageFormat(capabilities: Document): string {
    const getMapNodes = Array.from(capabilities.getElementsByTagName('*'))
      .filter(element => this.getLocalName(element) === 'GetMap');
    const formats = getMapNodes.length > 0 ?
      this.getDirectChildrenText(getMapNodes[0], 'Format') :
      [];

    return formats.indexOf('image/png') >= 0 ? 'image/png' : (formats[0] || 'image/png');
  }

  private getWmsCapabilitiesUrl(url: string): string {
    const parsedUrl = new URLParse(url, true);
    const query = Object.assign({}, parsedUrl.query || {}, {
      service: 'WMS',
      request: 'GetCapabilities',
    });
    const queryString = Object.keys(query)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
      .join('&');
    return `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}${queryString ? `?${queryString}` : ''}`;
  }

  private getDirectChildText(root: Element, name: string): string {
    const child = Array.from(root.children).find(element => this.getLocalName(element) === name);
    return child && child.textContent ? child.textContent.trim() : '';
  }

  private getDirectChildrenText(root: Element, name: string): string[] {
    return Array.from(root.children)
      .filter(element => this.getLocalName(element) === name && element.textContent)
      .map(element => element.textContent.trim());
  }

  private getFirstChildText(root: Element, names: string[]): string {
    for (const name of names) {
      const element = Array.from(root.getElementsByTagName('*'))
        .find(item => this.getLocalName(item) === name);
      if (element && element.textContent) {
        return element.textContent.trim();
      }
    }

    return '';
  }

  private loadWmsUrl(url: string, attribution = 'WMS', options: any = {}): void {
    const parsedUrl = new URLParse(url, true);
    const query = parsedUrl.query || {};
    const layers = options.layers || this.getQueryParam(query, ['layers', 'layer']);

    if (!layers) {
      this.loading = false;
      this.toastrService.danger("No WMS layer found in the URL", "Error");
      return;
    }

    if (this.map) {
      this.map.remove();
    }

    const serviceUrl = options.serviceUrl || this.getWmsServiceUrl(parsedUrl);
    this.map = L.map(this.geoJsonMap.nativeElement);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(this.map);

    L.tileLayer.wms(serviceUrl, {
      layers: layers,
      styles: options.styles || this.getQueryParam(query, ['styles']) || '',
      format: options.format || this.getQueryParam(query, ['format']) || 'image/png',
      transparent: options.transparent ? String(options.transparent).toLowerCase() === 'true' : this.getBooleanQueryParam(query, ['transparent'], true),
      version: options.version || this.getQueryParam(query, ['version']) || '1.1.1',
      attribution: attribution || 'WMS'
    }).addTo(this.map);

    if (options.bounds) {
      this.map.fitBounds(options.bounds);
      this.loading = false;
      return;
    }

    const bbox = this.getQueryParam(query, ['bbox']);
    if (bbox) {
      const values = bbox.split(',').map(value => Number(value));
      if (values.length === 4 && values.every(value => !isNaN(value))) {
        this.map.fitBounds([
          [values[1], values[0]],
          [values[3], values[2]]
        ]);
        this.loading = false;
        return;
      }
    }

    if (options.center) {
      this.map.setView(options.center, 9);
    } else {
      this.map.setView([0, 0], 2);
    }

    this.loading = false;
  }

  private isWmsUrl(url: string): boolean {
    try {
      const parsedUrl = new URLParse(url, true);
      const serviceKey = Object.keys(parsedUrl.query || {}).find(key => key.toLowerCase() === 'service');
      return !!serviceKey && String(parsedUrl.query[serviceKey]).toLowerCase() === 'wms';
    } catch (e) {
      return false;
    }
  }

  private getWmsServiceUrl(parsedUrl: any): string {
    const query = parsedUrl.query || {};
    const ignoredParams = [
      'service',
      'request',
      'layers',
      'layer',
      'styles',
      'format',
      'transparent',
      'version',
      'bbox',
      'width',
      'height',
      'srs',
      'crs'
    ];

    const passthroughParams = Object.keys(query)
      .filter(key => ignoredParams.indexOf(key.toLowerCase()) < 0)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`);

    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
    return passthroughParams.length > 0 ? `${baseUrl}?${passthroughParams.join('&')}` : baseUrl;
  }

  private getQueryParam(query: any, keys: string[]): string {
    for (const key of keys) {
      const foundKey = Object.keys(query).find(queryKey => queryKey.toLowerCase() === key.toLowerCase());
      if (foundKey && query[foundKey] !== undefined && query[foundKey] !== null && query[foundKey] !== '') {
        return query[foundKey];
      }
    }

    return '';
  }

  private getBooleanQueryParam(query: any, keys: string[], defaultValue: boolean): boolean {
    const value = this.getQueryParam(query, keys);
    return value ? value.toLowerCase() === 'true' : defaultValue;
  }
  
  openMap(distribution:DCATDistribution){
    if(this.type == 'geojson'){
      const url = distribution.downloadURL || distribution.accessURL || '';
      if(!url) {
        this.loading = false;
        this.toastrService.danger("No GeoJSON URL found for this distribution", "Error");
        return;
      }

      if(url.includes('.zip') || url.includes('.ZIP')){
        this.restApi.downloadZipFromUrl(distribution).subscribe(
          (res : Blob) => {
            res.arrayBuffer().then((buffer) => {
              var zip = new JSZip();
              zip.loadAsync(buffer).then((zip) => {
                const geoJsonEntries = zip.file(/\.(geojson|json)$/i);
                if (geoJsonEntries.length === 0) {
                  this.loading = false;
                  this.toastrService.danger("No GeoJSON file found in the ZIP", "Error");
                  return;
                }

                geoJsonEntries[0].async('string').then((content) => {
                  this.loadGeoJson(content, true);
                }).catch((err) => {
                  console.log(err);
                  this.loading = false;
                  this.toastrService.danger("Could not load the file", "Error");
                });
              })
              .catch((err) => {
                console.log(err);
                this.loading = false;
                this.toastrService.danger("Could not load the file", "Error");
              });
            }).catch((err) => {
              console.log(err);
              this.loading = false;
              this.toastrService.danger("Could not load the file", "Error");
            });
          },
          err => {
            console.log(err);
            this.loading = false;
            this.toastrService.danger("Could not load the file", "Error");
          }
        )
      } else{
        this.loadGeoJsonFromTextUrl(distribution, this.getDistributionUrls(distribution), 0);
      }
    } else if(this.type == 'wms') {
      this.loadWms(distribution);
    } else if(this.type == 'gml') {
      const url = distribution.downloadURL || distribution.accessURL || '';
      if(!url) {
        this.loading = false;
        this.toastrService.danger("No GML URL found for this distribution", "Error");
        return;
      }

      if(url.includes('.zip') || url.includes('.ZIP')){
        this.restApi.downloadZipFromUrl(distribution).subscribe(
          (res : Blob) => {
            res.arrayBuffer().then((buffer) => {
              var zip = new JSZip();
              zip.loadAsync(buffer).then((zip) => {
                const gmlEntries = zip.file(/\.(gml|xml)$/i);
                if (gmlEntries.length === 0) {
                  this.loading = false;
                  this.toastrService.danger("No GML file found in the ZIP", "Error");
                  return;
                }
                gmlEntries[0].async('string').then((content) => {
                  this.loadGml(content, true);
                }).catch((err) => {
                  console.log(err);
                  this.loading = false;
                  this.toastrService.danger("Could not load the file", "Error");
                });
              }).catch((err) => {
                console.log(err);
                this.loading = false;
                this.toastrService.danger("Could not load the file", "Error");
              });
            }).catch((err) => {
              console.log(err);
              this.loading = false;
              this.toastrService.danger("Could not load the file", "Error");
            });
          },
          err => {
            console.log(err);
            this.loading = false;
            this.toastrService.danger("Could not load the file", "Error");
          }
        )
      } else{
        this.loadGmlFromUrl(distribution);
      }
    } else if(this.type == 'kml') {
      const url = distribution.downloadURL || distribution.accessURL || '';
      if(url.includes('.zip') || url.includes('.ZIP')){
        this.restApi.downloadZipFromUrl(distribution).subscribe(
          (res : Blob) => {
            res.arrayBuffer().then((buffer) => {
              var zip = new JSZip();
              zip.loadAsync(buffer).then((zip) => {
                const kmlEntries = zip.file(/\.kml$/i);
                if (kmlEntries.length === 0) {
                  this.loadKmlFromExport(distribution);
                  return;
                }
                kmlEntries[0].async('string').then((content) => {
                  if (!this.loadKml(content, false)) {
                    this.loadKmlFromExport(distribution);
                  }
                }).catch((err) => {
                  console.log(err);
                  this.toastrService.danger("Could not load the file", "Error");
                });
              }).catch((err) => {
                console.log(err);
                this.toastrService.danger("Could not load the file", "Error");
              });
            }).catch((err) => {
              console.log(err);
              this.toastrService.danger("Could not load the file", "Error");
            });
          },
          err => {
            console.log(err);
            this.toastrService.danger("Could not load the file", "Error");
          }
        )
      } else{
        this.restApi.downloadTextFromUri(distribution).subscribe(
          (res : string) => {
            if (!this.loadKml(res, false)) {
              this.loadKmlFromExport(distribution);
            }
          },
          err => {
            this.loadKmlFromExport(distribution);
          }
        )
      }
    } else if(this.type == 'shp'){
      if(distribution.downloadURL.includes('.zip') || distribution.downloadURL.includes('.ZIP')){

        this.restApi.downloadZipFromUrl(distribution).subscribe(
          (res : Blob) => {
        
            res.arrayBuffer().then((arrayBufferData) => {
              JSZip.loadAsync(arrayBufferData).then((z) => {
        
                let zip = z.file(/.+/);
        
                const names = [];
                const whiteList = [];
                const out1 = {};
        
                zip.map((a) => {
                  let result;
                  if (
                    a.name.slice(-3).toLowerCase() === "shp" ||
                    a.name.slice(-3).toLowerCase() === "dbf"
                  ) {
                    result = a;
                  } else {
                    result = a;
                  }
                  out1[a.name] = result;
                  return out1;
                });
        
                zip = out1 as any;
                const out2 = {};
                const promises = [];
        
                for (const key in zip) {
                  if (key.indexOf("__MACOSX") !== -1) {
                    continue;
                  }
                  if (key.slice(-3).toLowerCase() === "shp") {
                    names.push(key.slice(0, -4));
                    promises.push(
                      zip[key].async("arraybuffer").then((s) => {
                        out2[key.slice(0, -3) + key.slice(-3).toLowerCase()] = s;
                      })
                    );
                  } else if (key.slice(-3).toLowerCase() === "prj") {
                    promises.push(
                      zip[key].async("string").then((s) => {
                        out2[key.slice(0, -3) + key.slice(-3).toLowerCase()] = proj4(s);
                      })
                    );
                  } else if (
                    key.slice(-4).toLowerCase() === "json" ||
                    whiteList.indexOf(key.split(".").pop()) > -1
                  ) {
                    names.push(key.slice(0, -3) + key.slice(-3).toLowerCase());
                  } else if (
                    key.slice(-3).toLowerCase() === "dbf" ||
                    key.slice(-3).toLowerCase() === "cpg"
                  ) {
                    promises.push(
                      zip[key].async("arraybuffer").then((s) => {
                        out2[key.slice(0, -3) + key.slice(-3).toLowerCase()] = s;
                      })
                    );
                  }
                }
        
                Promise.all(promises).then(async (d) => {
                  var features;
                  try {
                    features = shp.combine([
                      shp.parseShp(out2[names + ".shp"], out2[names + ".prj"]),
                      shp.parseDbf(out2[names + ".dbf"])
                    ]);
                  } catch (error) {
                    if ((names.length === 0) && (out2!)) {
                      console.error("not a shape file");
                      this.toastrService.danger("Not a shapefile", "Error");
                      return
                    }
                    features = await this.extractAndDecodeShapefiles(res);
                    this.loadShapeFile(features);
                    return
                  }
        
        
                  this.loadShapeFile(features.features);
                });
              });
            });
          },
          err => {
            console.log(err);
            this.toastrService.danger("Could not load the file", "Error");
          }
        )
      }
    } else {
      this.toastrService.danger("Format not valid", "Error");
    }
  }

  public loadShapeFile(file: any) {

    const geoJsonArray = file;
    console.log('Response Shape File: ' + geoJsonArray);

    if (this.map) {
      this.map.remove();
    }

    const geoJsonData = geoJsonArray[0];
    globalThis.file_content = geoJsonArray[0];

    console.log("DATA");
    console.log(geoJsonData);

    // Creazione mappa Leaflet
    let latLng = [0, 0];
    // let featuresLenght = Math.floor(geoJsonData['features'].length/2);

    if(typeof geoJsonData['geometry']['coordinates'][0] == 'number'){
      latLng[0] += geoJsonData['geometry']['coordinates'][1];
      latLng[1] += geoJsonData['geometry']['coordinates'][0];
    } else if(typeof geoJsonData['geometry']['coordinates'][0][0] == 'number'){
      latLng[0] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][1];
      latLng[1] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][0];
    } else if(typeof geoJsonData['geometry']['coordinates'][0][0][0] == 'number'){
      latLng[0] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)][1];
      latLng[1] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)][0];
    } else if(typeof geoJsonData['geometry']['coordinates'][0][0][0][0] == 'number'){
      latLng[0] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)].length/2)][1];
      latLng[1] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)].length/2)][0];
    }
    
    this.map = L.map(this.geoJsonMap.nativeElement).setView(L.latLng(latLng[0], latLng[1]), 9);

    // if (this.addToBucket.active) {
    //   this.map = L.map(this.geoJsonMap.nativeElement).setView([0, 0], 2);
    // } else if (this.privateBucket.active) {
    //   this.map = L.map(this.geoJsonMapBucket.nativeElement).setView([0, 0], 2);
    // } else if (this.pilotBucket.active) {
    //   this.map = L.map(this.geoJsonMapPilotBucket.nativeElement).setView([0, 0], 2);
    // } else if (this.publicBucket.active) {
    //   this.map = L.map(this.geoJsonMapPublicBucket.nativeElement).setView([0, 0], 2);
    // }

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    geoJsonArray.forEach(geoJson => {
      L.geoJSON(geoJson, {
        // pointToLayer: function (feature, latlng) {
        // return new L.CircleMarker(latlng, {radius: 5, 
        //     fillOpacity: 1, 
        //     color: 'black', 
        //     fillColor: 'blue', 
        //     weight: 1,});
        // },
        onEachFeature: this.onEachFeature
    }
      ).addTo(this.map);
    });

    this.loading = false;
  }
  onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties) {
      // map json properties to popup
      let popupContent = "<p>";
      for (const key in feature.properties) {
        popupContent += "- "+ key + ": " + feature.properties[key] + "<br>";
      }
      popupContent += "</p>";
      layer.bindPopup(popupContent);
    }
  }
  async extractAndDecodeShapefiles(file: Blob): Promise<any> {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    const geoJsonArray = [];
    console.log("sto iterando i file")

    var prjFileName;
    var havePRJ = false;
    var prjFileContent;
    // Itera sui file all'interno del file .zip
    await Promise.all(Object.keys(zipContent.files).map(async (fileName) => {
      try {
        if (fileName.endsWith('.prj')) {
          havePRJ = true;
          const lastDotPRJ = fileName.lastIndexOf('.');
          prjFileName = fileName.slice(0, lastDotPRJ);
          prjFileContent = await zipContent.files[fileName].async('arraybuffer');
          console.log("creato file prj" + fileName);
        }
        if (fileName.endsWith('.shp') || fileName.endsWith('.shx')) {
          const shpFileContent = await zipContent.files[fileName].async('arraybuffer');
          const lastDotSHP = fileName.lastIndexOf('.');
          var shpFileName = fileName.slice(0, lastDotSHP);
          if (havePRJ && prjFileName === shpFileName) {
            const geoJson = await shp.parseShp(shpFileContent, prjFileContent);
            geoJsonArray.push(geoJson);
            havePRJ = false;
          } else {
            const geoJson = await shp.parseShp(shpFileContent);
            geoJsonArray.push(geoJson);
          }
          console.log("aggiunto file shp" + fileName);
        } else if (fileName.endsWith('.dbf')) {
          const dbfFileContent = await zipContent.files[fileName].async('arraybuffer');
          const geoJson = await shp.parseDbf(dbfFileContent);
          console.log("aggiunto file dbf" + fileName);
          geoJsonArray.push(geoJson);
        }
      } catch (error) {
        console.log("error: " + fileName + ": " + error);
      }
    }));
    console.log("raggiunto fine file")

    return geoJsonArray;
  }
}
