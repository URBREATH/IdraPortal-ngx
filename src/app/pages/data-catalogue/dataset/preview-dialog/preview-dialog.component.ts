import { Component, Input } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { HttpClient } from '@angular/common/http';
import { DCATDistribution } from '../../model/dcatdistribution';
import { DataCataglogueAPIService } from '../../services/data-cataglogue-api.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'ngx-remoteCatalogue-dialog',
  templateUrl: 'preview-dialog.component.html',
  styleUrls: ['preview-dialog.component.scss'],
})
export class PreviewDialogComponent {

  @Input() title: string;
  url: string;
  loading: boolean;
  text: string;
  jsonDistribution: DCATDistribution;
  jsonText: string;
  jsonMessage: string;
  jsonHeaders: string[] = [];
  jsonRows: any[][] = [];
  csvText: string;
  csvDistribution: DCATDistribution;
  csvHeaders: string[] = [];
  csvRows: string[][] = [];
  csvMessage: string;
  csvEncoding = 'auto';
  csvDetectedEncoding = '';
  csvPreviewRows = 100;
  csvEncodings = [
    { label: 'Auto', value: 'auto' },
    { label: 'UTF-8', value: 'utf-8' },
    { label: 'Windows-1252 (CP1252)', value: 'windows-1252' },
    { label: 'ISO-8859-1', value: 'iso-8859-1' },
    { label: 'UTF-16 LE', value: 'utf-16le' },
    { label: 'UTF-16 BE', value: 'utf-16be' },
  ];
  private csvArrayBuffer: ArrayBuffer;
  youtubeUrl: string;
  htmlUrl: string;
  imageUrl: string;
  imageType: string;
  safeHtmlUrl: SafeResourceUrl;
  safeImageUrl: SafeResourceUrl;
  isEndpoint: boolean = false;
  endpointUrl: string;

  constructor(
    protected ref: NbDialogRef<PreviewDialogComponent>,
    private restApi: DataCataglogueAPIService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    // --- CASE 0: CSV table
    if (this.jsonDistribution) {
      this.loadJsonPreview();
      return;
    }

    if (this.csvDistribution) {
      this.loadCsvPreview();
      return;
    }

    if (this.csvText !== undefined) {
      this.csvArrayBuffer = new TextEncoder().encode(this.csvText).buffer;
      this.renderCsvPreview(this.csvText);
      return;
    }

    // --- CASE 1: Endpoint
    if (this.isEndpoint && this.endpointUrl) {
      this.loading = false;
      return;
    }

    // --- CASE 2: HTML page
    if (this.htmlUrl) {
      this.safeHtmlUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.htmlUrl);
      this.loading = false;
      return;
    }

    // --- CASE 3: Image
    if (this.imageUrl) {
      this.safeImageUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.imageUrl);
      this.loading = false;
      return;
    }

    // --- CASE 4: YouTube video
    if (this.youtubeUrl) {
      this.loading = true;
      const iframe = document.createElement('iframe');
      iframe.setAttribute('width', '560');
      iframe.setAttribute('height', '315');
      iframe.setAttribute('style', 'height: 70vh; width: 80vw; border: none;');
      iframe.setAttribute('title', 'YouTube video player');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'encrypted-media; picture-in-picture');
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.src = this.youtubeUrl;

      iframe.onload = () => this.loading = false;
      iframe.onerror = () => this.loading = false;

      document.getElementById('iframeBody')?.appendChild(iframe);
      return;
    }

    // --- CASE 5: Show Google Doc (when text is undefined)
    if (this.text === undefined) {
      this.loading = true;
      const src = 'https://docs.google.com/gview?url=' + this.url + '&embedded=true';

      const iframe = document.createElement('iframe');
      iframe.setAttribute('style', 'height: 70vh;width: 80vw;');
      iframe.src = src;

      const interval = setInterval(() => {
        this.loading = true;
        iframe.src = src;
      }, 5000);

      iframe.onload = () => {
        this.loading = false;
        clearInterval(interval);
      };

      iframe.onerror = () => {
        this.loading = false;
      };

      document.getElementById('iframeBody')?.appendChild(iframe);
      return;
    }

    // --- CASE 6: Show raw text (JSON pretty-print if possible)
    this.loading = true;
    const pre = document.createElement('pre');
    pre.setAttribute('style', 'height: 70vh;width: 80vw;overflow: auto;');
    pre.setAttribute('readonly', 'true');

    try {
      const parsed = JSON.parse(this.text);
      pre.textContent = JSON.stringify(parsed, null, 2);
    } catch (e) {
      pre.textContent = this.text;
    }

    document.getElementById('iframeBody')?.appendChild(pre);

    this.loading = false;
  }

  private loadJsonPreview() {
    this.loading = true;
    this.jsonMessage = '';
    this.jsonText = '';
    this.jsonHeaders = [];
    this.jsonRows = [];

    this.loadJsonFromDirectUrl(() => this.loadJsonFromProxy());
  }

  private loadJsonFromDirectUrl(fallback?: () => void) {
    const url = this.jsonDistribution && (this.jsonDistribution.downloadURL || this.jsonDistribution.accessURL);
    if (!url) {
      fallback ? fallback() : this.showJsonError();
      return;
    }

    this.http.get(url, { responseType: 'text' }).subscribe(
      (res: string) => {
        if (!this.renderJsonPreview(res, false) && fallback) {
          fallback();
        }
      },
      () => fallback ? fallback() : this.showJsonError()
    );
  }

  private loadJsonFromProxy() {
    this.restApi.downloadTextFromUri(this.jsonDistribution).subscribe(
      (res: string) => this.renderJsonPreview(res, true),
      () => this.showJsonError()
    );
  }

  private renderJsonPreview(value: any, showRawOnError = true): boolean {
    const parsed = this.parseJsonPreview(value);
    if (parsed === undefined) {
      if (!showRawOnError) {
        return false;
      }
      this.jsonText = this.normalizeJsonText(value);
      this.jsonMessage = 'Could not parse JSON. Showing raw response.';
    } else {
      if (!this.renderJsonTable(parsed)) {
        this.jsonText = JSON.stringify(parsed, null, 2);
      }
      this.jsonMessage = '';
    }

    this.loading = false;
    return parsed !== undefined;
  }

  private renderJsonTable(value: any): boolean {
    const rows = this.getJsonRows(value);
    if (!rows || rows.length === 0 || !rows.every(row => row && typeof row === 'object' && !Array.isArray(row))) {
      return false;
    }

    this.jsonHeaders = [];
    rows.forEach(row => {
      Object.keys(row).forEach(key => {
        if (this.jsonHeaders.indexOf(key) < 0) {
          this.jsonHeaders.push(key);
        }
      });
    });

    this.jsonRows = rows.map(row => this.jsonHeaders.map(header => this.formatJsonCell(row[header])));
    this.jsonText = '';
    return true;
  }

  private getJsonRows(value: any): any[] {
    if (Array.isArray(value)) {
      return value;
    }

    if (!value || typeof value !== 'object') {
      return [];
    }

    if (Array.isArray(value.data)) {
      return value.data;
    }

    if (Array.isArray(value.results)) {
      return value.results;
    }

    if (Array.isArray(value.items)) {
      return value.items;
    }

    return [];
  }

  private formatJsonCell(value: any): string {
    if (value === undefined || value === null) {
      return '';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  private parseJsonPreview(value: any): any {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== 'string') {
      return this.unwrapJsonPreviewValue(value);
    }

    const normalizedText = this.normalizeJsonText(value);
    const decodedText = this.decodeHtmlEntities(normalizedText);
    const unescapedText = this.unescapeJsonText(normalizedText);
    const unescapedDecodedText = this.unescapeJsonText(decodedText);
    const urlDecodedText = this.decodeUrlJsonText(normalizedText);
    const attempts = this.uniqueJsonAttempts([
      normalizedText,
      decodedText,
      unescapedText,
      unescapedDecodedText,
      urlDecodedText,
      this.stripJsonCallback(normalizedText),
      this.stripJsonCallback(decodedText),
      this.stripJsonCallback(unescapedText),
      this.stripJsonCallback(unescapedDecodedText),
      this.stripJsonCallback(urlDecodedText),
      this.extractJsonPreviewText(normalizedText),
      this.extractJsonPreviewText(decodedText),
      this.extractJsonPreviewText(unescapedText),
      this.extractJsonPreviewText(unescapedDecodedText),
      this.extractJsonPreviewText(urlDecodedText),
      this.extractJsonPreviewText(this.stripJsonCallback(normalizedText)),
      this.extractJsonPreviewText(this.stripJsonCallback(decodedText)),
      this.extractJsonPreviewText(this.stripJsonCallback(unescapedText)),
      this.extractJsonPreviewText(this.stripJsonCallback(unescapedDecodedText)),
      this.extractJsonPreviewText(this.stripJsonCallback(urlDecodedText)),
    ]);

    for (const item of attempts) {
      try {
        const parsed = JSON.parse(item);
        return typeof parsed === 'string' ? this.parseJsonPreview(parsed) : this.unwrapJsonPreviewValue(parsed);
      } catch (e) {}
    }

    return undefined;
  }

  private unwrapJsonPreviewValue(value: any): any {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const wrapperKeys = ['content', 'fileContent', 'result', 'body'];
    const objectKeys = Object.keys(value);

    for (const key of wrapperKeys) {
      if (objectKeys.length <= 3 && typeof value[key] === 'string') {
        const nested = this.parseJsonPreview(value[key]);
        if (nested !== undefined) {
          return nested;
        }
      }
    }

    return value;
  }

  private normalizeJsonText(value: any): string {
    if (value === undefined || value === null) {
      return '';
    }

    return (typeof value === 'string' ? value : JSON.stringify(value))
      .trim()
      .replace(/^\uFEFF/, '')
      .replace(/^\)\]\}',?\s*/, '')
      .trim();
  }

  private decodeHtmlEntities(text: string): string {
    if (!text || text.indexOf('&') < 0) {
      return text;
    }

    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value.trim();
  }

  private unescapeJsonText(text: string): string {
    return (text || '')
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\//g, '/')
      .trim();
  }

  private decodeUrlJsonText(text: string): string {
    try {
      return decodeURIComponent(text).trim();
    } catch (e) {
      return text;
    }
  }

  private stripJsonCallback(text: string): string {
    const trimmed = (text || '').trim().replace(/;$/, '');
    const match = trimmed.match(/^[\w$.]+\(([\s\S]*)\)$/);
    return match ? match[1].trim() : trimmed;
  }

  private uniqueJsonAttempts(values: string[]): string[] {
    return values
      .filter(value => !!value && value.trim() !== '')
      .filter((value, index, array) => array.indexOf(value) === index);
  }

  private extractJsonPreviewText(text: string): string {
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

  private showJsonError() {
    this.jsonMessage = 'Could not load JSON preview.';
    this.loading = false;
  }

  private loadCsvPreview() {
    this.loading = true;
    this.csvMessage = '';
    this.csvHeaders = [];
    this.csvRows = [];

    this.loadCsvPreviewFromDirectBuffer();
  }

  private loadCsvPreviewFromDirectBuffer() {
    const url = this.csvDistribution && (this.csvDistribution.downloadURL || this.csvDistribution.accessURL);
    if (!url) {
      this.loadCsvPreviewFromBlob();
      return;
    }

    this.http.get(url, { responseType: 'arraybuffer' }).subscribe(
      (buffer: ArrayBuffer) => {
        this.csvArrayBuffer = buffer;
        this.renderCsvFromBuffer();
      },
      () => this.loadCsvPreviewFromBlob()
    );
  }

  private loadCsvPreviewFromBlob() {
    this.restApi.downloadBlobFromUri(this.csvDistribution).subscribe(
      (blob: Blob) => {
        blob.arrayBuffer().then((buffer) => {
          this.csvArrayBuffer = buffer;
          const decoded = this.decodeArrayBuffer(buffer, this.csvEncoding);
          if (this.csvEncoding === 'auto') {
            this.csvDetectedEncoding = decoded.encoding;
          }
          this.renderCsvPreviewOrFallback(decoded.text, () => this.loadCsvPreviewFromDirectUrl(), decoded.encoding);
        }).catch(() => this.loadCsvPreviewFromDirectUrl());
      },
      () => this.loadCsvPreviewFromDirectUrl()
    );
  }

  private renderCsvFromBuffer() {
    if (!this.csvArrayBuffer) {
      this.showCsvError();
      return;
    }

    const decoded = this.decodeArrayBuffer(this.csvArrayBuffer, this.csvEncoding);
    if (this.csvEncoding === 'auto') {
      this.csvDetectedEncoding = decoded.encoding;
    }
    this.renderCsvPreview(decoded.text, decoded.encoding);
  }

  onCsvEncodingChange(encoding: string) {
    this.csvEncoding = encoding;
    if (this.csvDistribution && this.csvArrayBuffer) {
      this.renderCsvFromBuffer();
      return;
    }

    this.renderCsvPreview(this.csvText || '');
  }

  onCsvPreviewRowsChange(rows: number) {
    this.csvPreviewRows = Math.max(1, Number(rows) || 100);
    if (this.csvDistribution && this.csvArrayBuffer) {
      this.renderCsvFromBuffer();
      return;
    }

    this.renderCsvPreview(this.csvText || '');
  }

  refreshCsvPreview() {
    if (this.csvDistribution) {
      this.csvArrayBuffer = undefined;
      this.csvDetectedEncoding = '';
      this.loadCsvPreview();
      return;
    }

    this.renderCsvPreview(this.csvText || '');
  }

  private loadCsvPreviewFromDirectUrl() {
    const url = this.csvDistribution && (this.csvDistribution.downloadURL || this.csvDistribution.accessURL);
    if (!url) {
      this.showCsvError();
      return;
    }

    this.http.get(url, { responseType: 'text' }).subscribe(
      (text: string) => this.renderCsvPreviewOrFallback(text, () => this.showCsvError()),
      () => this.showCsvError()
    );
  }

  private loadCsvBufferInBackground() {
    if (this.csvArrayBuffer) {
      return;
    }

    this.restApi.downloadBlobFromUri(this.csvDistribution).subscribe(
      (blob: Blob) => {
        blob.arrayBuffer().then((buffer) => {
          this.csvArrayBuffer = buffer;
          const decoded = this.decodeArrayBuffer(buffer, 'auto');
          this.csvDetectedEncoding = decoded.encoding;
        });
      },
      () => {}
    );
  }

  private renderCsvPreviewOrFallback(text: string, fallback: () => void, usedEncoding?: string, afterRender?: () => void) {
    if (this.hasCsvContent(text)) {
      this.renderCsvPreview(text, usedEncoding);
      if (afterRender) {
        afterRender();
      }
    } else {
      fallback();
    }
  }

  private hasCsvContent(text: any): boolean {
    const normalizedText = this.normalizePreviewText(text);
    return normalizedText.length > 0;
  }

  private showCsvError() {
    this.csvMessage = 'Could not load CSV preview.';
    this.loading = false;
  }

  private renderCsvPreview(csvText: string, usedEncoding?: string) {
    this.loading = true;
    this.csvMessage = '';
    const rows = this.parseCsv(this.normalizePreviewText(csvText));

    if (rows.length === 0) {
      this.csvMessage = 'CSV preview is empty.';
      this.loading = false;
      return;
    }

    const maxRows = this.csvPreviewRows;
    this.csvHeaders = rows[0];
    this.csvRows = rows.slice(1, maxRows + 1);

    if (this.csvRows.length === 0 && this.csvHeaders.length > 0) {
      this.csvRows = [this.csvHeaders];
      this.csvHeaders = this.csvHeaders.map((_, index) => `Column ${index + 1}`);
    }

    if (rows.length > maxRows + 1) {
      this.csvMessage = `Showing first ${maxRows} rows of ${rows.length - 1}${usedEncoding ? ' - encoding ' + usedEncoding : ''}.`;
    } else if (usedEncoding || this.csvDetectedEncoding) {
      this.csvMessage = `Encoding ${usedEncoding || this.csvDetectedEncoding}.`;
    }

    this.loading = false;
  }

  private decodeArrayBuffer(buffer: ArrayBuffer, encoding: string): { text: string, encoding: string } {
    const bytes = new Uint8Array(buffer);
    let selectedEncoding = encoding;

    if (selectedEncoding === 'auto') {
      selectedEncoding = this.detectBomEncoding(bytes) || this.guessCsvEncoding(bytes);
    }

    try {
      let text = new TextDecoder(selectedEncoding).decode(bytes);
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }
      return { text, encoding: selectedEncoding };
    } catch (e) {
      return { text: new TextDecoder('utf-8').decode(bytes), encoding: 'utf-8' };
    }
  }

  private detectBomEncoding(bytes: Uint8Array): string {
    if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      return 'utf-8';
    }
    if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
      return 'utf-16le';
    }
    if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
      return 'utf-16be';
    }
    return '';
  }

  private guessCsvEncoding(bytes: Uint8Array): string {
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      return 'utf-8';
    } catch (e) {
      return 'windows-1252';
    }
  }

  private normalizePreviewText(value: any): string {
    if (value === undefined || value === null) {
      return '';
    }

    let text = typeof value === 'string' ? value : JSON.stringify(value);
    text = text.trim();

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string') {
        text = parsed;
      } else if (parsed && typeof parsed === 'object') {
        text = this.findCsvLikeText(parsed) || (parsed.content || parsed.fileContent || parsed.data || parsed.result || parsed.body || text).toString();
      }
    } catch (e) {}

    return text
      .replace(/^\uFEFF/, '')
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\//g, '/')
      .trim();
  }

  private findCsvLikeText(value: any): string {
    if (typeof value === 'string') {
      const text = value.trim();
      if (text && (text.indexOf('\n') >= 0 || text.indexOf(';') >= 0 || text.indexOf(',') >= 0 || text.indexOf('\t') >= 0)) {
        return text;
      }
      return '';
    }

    if (!value || typeof value !== 'object') {
      return '';
    }

    for (const key of Object.keys(value)) {
      const result = this.findCsvLikeText(value[key]);
      if (result) {
        return result;
      }
    }

    return '';
  }

  private parseCsv(csv: string): string[][] {
    const normalizedCsv = csv.replace(/^\uFEFF/, '').trim();
    if (!normalizedCsv) {
      return [];
    }

    const delimiter = this.detectCsvDelimiter(normalizedCsv);
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < normalizedCsv.length; i++) {
      const char = normalizedCsv[i];
      const nextChar = normalizedCsv[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(cell);
        cell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }

    row.push(cell);
    rows.push(row);

    const maxColumns = Math.max(...rows.map(r => r.length));
    return rows
      .filter(r => r.some(value => value.trim() !== ''))
      .map(r => {
        while (r.length < maxColumns) {
          r.push('');
        }
        return r;
      });
  }

  private detectCsvDelimiter(csv: string): string {
    const firstLine = csv.split(/\r?\n/)[0] || '';
    const delimiters = [',', ';', '\t', '|'];
    return delimiters.reduce((bestDelimiter, delimiter) => {
      const currentCount = firstLine.split(delimiter).length;
      const bestCount = firstLine.split(bestDelimiter).length;
      return currentCount > bestCount ? delimiter : bestDelimiter;
    }, ',');
  }

  // --- FIX: method must be OUTSIDE ngOnInit()
  openEndpointInNewWindow() {
    if (this.endpointUrl) {
      window.open(this.endpointUrl, '_blank');
    }
  }
}


