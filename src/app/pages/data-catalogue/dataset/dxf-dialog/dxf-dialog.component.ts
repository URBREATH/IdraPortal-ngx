import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NbDialogRef, NbToastrService } from '@nebular/theme';
import { DCATDistribution } from '../../model/dcatdistribution';
import { DataCataglogueAPIService } from '../../services/data-cataglogue-api.service';
import JSZip from 'jszip';

type DxfShape = {
  type: 'line' | 'polyline' | 'circle' | 'arc' | 'point' | 'text';
  points?: Array<{ x: number; y: number }>;
  x?: number;
  y?: number;
  r?: number;
  startAngle?: number;
  endAngle?: number;
  text?: string;
  height?: number;
  closed?: boolean;
};

type ZipDxfEntry = {
  name: string;
  entry: JSZip.JSZipObject;
};

@Component({
  selector: 'ngx-dxf-dialog',
  templateUrl: 'dxf-dialog.component.html',
  styleUrls: ['dxf-dialog.component.scss'],
})
export class DxfDialogComponent {

  @Input() title: string;
  distribution: DCATDistribution;
  loading = false;
  message = '';
  shapes: DxfShape[] = [];
  unsupportedCount = 0;
  viewBox = '0 0 100 100';
  zoomLevel = 1;
  zipEntries: ZipDxfEntry[] = [];
  selectedZipEntryName = '';
  private baseViewBox: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  };

  constructor(
    protected ref: NbDialogRef<DxfDialogComponent>,
    private restApi: DataCataglogueAPIService,
    private http: HttpClient,
    private toastrService: NbToastrService,
  ) {}

  ngOnInit() {
    this.loading = true;
    this.loadDxf();
  }

  get polylineShapes(): DxfShape[] {
    return this.shapes.filter(shape => shape.type === 'polyline');
  }

  get lineShapes(): DxfShape[] {
    return this.shapes.filter(shape => shape.type === 'line');
  }

  get circleShapes(): DxfShape[] {
    return this.shapes.filter(shape => shape.type === 'circle');
  }

  get arcShapes(): DxfShape[] {
    return this.shapes.filter(shape => shape.type === 'arc');
  }

  get pointShapes(): DxfShape[] {
    return this.shapes.filter(shape => shape.type === 'point');
  }

  get textShapes(): DxfShape[] {
    return this.shapes.filter(shape => shape.type === 'text');
  }

  zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomLevel * 1.25, 20);
    this.applyZoomViewBox();
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomLevel / 1.25, 0.2);
    this.applyZoomViewBox();
  }

  resetZoom(): void {
    this.zoomLevel = 1;
    this.applyZoomViewBox();
  }

  private loadDxf(): void {
    const url = this.distribution && (this.distribution.downloadURL || this.distribution.accessURL);
    if (!url) {
      this.loading = false;
      this.toastrService.danger('No DXF URL found for this distribution', 'Error');
      return;
    }

    if (this.isZipUrl(url)) {
      this.loadDxfFromZip();
      return;
    }

    this.restApi.downloadTextFromUri(this.distribution).subscribe(
      (res: string) => {
        if (this.looksLikeZipText(res)) {
          this.loadDxfFromZip();
          return;
        }

        this.renderDxf(res);
      },
      () => this.loadDxfFromDirectUrl(url)
    );
  }

  private loadDxfFromDirectUrl(url: string): void {
    if (this.isZipUrl(url)) {
      this.loadDxfFromDirectZipUrl(url);
      return;
    }

    this.http.get(url, { responseType: 'text' }).subscribe(
      (res: string) => {
        if (this.looksLikeZipText(res)) {
          this.loadDxfFromDirectZipUrl(url);
          return;
        }

        this.renderDxf(res);
      },
      () => {
        this.loading = false;
        this.toastrService.danger('Could not load the file', 'Error');
      }
    );
  }

  private loadDxfFromZip(): void {
    this.restApi.downloadBlobFromUri(this.distribution).subscribe(
      (res: Blob) => this.renderDxfZip(res, () => this.loadDxfFromExportZip()),
      () => this.loadDxfFromExportZip()
    );
  }

  private loadDxfFromExportZip(): void {
    this.restApi.downloadZipFromUrl(this.distribution).subscribe(
      (res: Blob) => this.renderDxfZip(res, () => this.loadDxfFromDirectZipUrl(this.distribution.downloadURL || this.distribution.accessURL)),
      () => this.loadDxfFromDirectZipUrl(this.distribution.downloadURL || this.distribution.accessURL)
    );
  }

  private loadDxfFromDirectZipUrl(url: string): void {
    this.http.get(url, { responseType: 'blob' }).subscribe(
      (res: Blob) => this.renderDxfZip(res),
      () => {
        this.loading = false;
        this.toastrService.danger('Could not load the file', 'Error');
      }
    );
  }

  private renderDxfZip(file: Blob, fallback?: () => void): void {
    file.arrayBuffer()
      .then(buffer => JSZip.loadAsync(buffer))
      .then(zip => {
        const dxfEntries = zip.file(/\.dxf$/i)
          .filter(entry => !entry.dir)
          .sort((a, b) => a.name.localeCompare(b.name));
        if (dxfEntries.length === 0) {
          if (fallback) {
            fallback();
            return;
          }

          this.loading = false;
          this.toastrService.danger('No DXF file found in the ZIP', 'Error');
          return;
        }

        this.zipEntries = dxfEntries.map(entry => ({
          name: entry.name,
          entry,
        }));
        return this.selectZipEntry(this.zipEntries[0].name);
      })
      .catch(() => {
        if (fallback) {
          fallback();
          return;
        }

        this.loading = false;
        this.toastrService.danger('Could not load the file', 'Error');
      });
  }

  selectZipEntry(entryName: string): void {
    const zipEntry = this.zipEntries.find(entry => entry.name === entryName);
    if (!zipEntry) {
      return;
    }

    this.loading = true;
    this.selectedZipEntryName = zipEntry.name;
    zipEntry.entry.async('string')
      .then(content => this.renderDxf(content))
      .catch(() => {
        this.loading = false;
        this.toastrService.danger('Could not load the selected DXF file', 'Error');
      });
  }

  onManualFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
      return;
    }

    this.loading = true;
    this.message = '';
    this.shapes = [];
    this.unsupportedCount = 0;
    this.zipEntries = [];
    this.selectedZipEntryName = '';

    if (this.isZipUrl(file.name)) {
      this.renderDxfZip(file);
      input.value = '';
      return;
    }

    file.text()
      .then(content => this.renderDxf(content))
      .catch(() => {
        this.loading = false;
        this.toastrService.danger('Could not load the selected DXF file', 'Error');
      })
      .finally(() => {
        input.value = '';
      });
  }

  private isZipUrl(url: string): boolean {
    return /\.zip($|[?#])/i.test(url || '');
  }

  private looksLikeZipText(text: string): boolean {
    return !!text && text.charCodeAt(0) === 0x50 && text.charCodeAt(1) === 0x4b;
  }

  private renderDxf(text: string): void {
    try {
      const result = this.parseDxf(text || '');
      this.shapes = result.shapes;
      this.unsupportedCount = result.unsupportedCount;
      this.updateViewBox();

      if (this.shapes.length === 0) {
        this.message = 'No previewable DXF entities found.';
      } else if (this.unsupportedCount > 0) {
        this.message = `${this.shapes.length} entities rendered. ${this.unsupportedCount} unsupported entities skipped.`;
      } else {
        this.message = `${this.shapes.length} entities rendered.`;
      }
    } catch (e) {
      this.toastrService.danger('Invalid DXF file', 'Error');
    }

    this.loading = false;
  }

  private parseDxf(text: string): { shapes: DxfShape[]; unsupportedCount: number } {
    const pairs = this.parsePairs(text);
    const blocks = this.parseBlocks(this.getSectionPairs(pairs, 'BLOCKS'));
    const entityPairs = this.getSectionPairs(pairs, 'ENTITIES');
    const parsed = this.parseShapes(entityPairs.length > 0 ? entityPairs : pairs, blocks);

    return { shapes: parsed.shapes, unsupportedCount: parsed.unsupportedCount };
  }

  private parsePairs(text: string): Array<{ code: string; value: string }> {
    const lines = text.replace(/\r/g, '').split('\n');
    const pairs = [];

    for (let i = 0; i < lines.length - 1; i++) {
      const code = lines[i].trim();
      if (!/^-?\d+$/.test(code)) {
        continue;
      }

      pairs.push({
        code,
        value: lines[i + 1].trim(),
      });
      i++;
    }

    return pairs;
  }

  private getSectionPairs(pairs: Array<{ code: string; value: string }>, sectionName: string): Array<{ code: string; value: string }> {
    for (let i = 0; i < pairs.length - 1; i++) {
      if (pairs[i].code === '0' && pairs[i].value.toUpperCase() === 'SECTION' &&
        pairs[i + 1].code === '2' && pairs[i + 1].value.toUpperCase() === sectionName) {
        const sectionPairs = [];
        for (let j = i + 2; j < pairs.length; j++) {
          if (pairs[j].code === '0' && pairs[j].value.toUpperCase() === 'ENDSEC') {
            return sectionPairs;
          }
          sectionPairs.push(pairs[j]);
        }
      }
    }

    return [];
  }

  private parseBlocks(pairs: Array<{ code: string; value: string }>): { [name: string]: DxfShape[] } {
    const rawBlocks: { [name: string]: Array<{ code: string; value: string }> } = {};

    for (let i = 0; i < pairs.length; i++) {
      if (pairs[i].code !== '0' || pairs[i].value.toUpperCase() !== 'BLOCK') {
        continue;
      }

      const header = this.collectEntity(pairs, i + 1);
      const namePair = header.find(pair => pair.code === '2' || pair.code === '3');
      const name = namePair && namePair.value;
      const blockPairs = [];
      i += header.length;

      for (let j = i + 1; j < pairs.length; j++) {
        if (pairs[j].code === '0' && pairs[j].value.toUpperCase() === 'ENDBLK') {
          i = j;
          break;
        }
        blockPairs.push(pairs[j]);
      }

      if (name) {
        rawBlocks[name] = blockPairs;
      }
    }

    const blocks: { [name: string]: DxfShape[] } = {};
    Object.keys(rawBlocks).forEach(name => {
      blocks[name] = this.parseShapes(rawBlocks[name], blocks).shapes;
    });

    return blocks;
  }

  private parseShapes(
    pairs: Array<{ code: string; value: string }>,
    blocks: { [name: string]: DxfShape[] } = {},
  ): { shapes: DxfShape[]; unsupportedCount: number } {
    const shapes: DxfShape[] = [];
    let unsupportedCount = 0;

    for (let i = 0; i < pairs.length; i++) {
      if (pairs[i].code !== '0') {
        continue;
      }

      const type = pairs[i].value.toUpperCase();
      if (type === 'LINE') {
        const entity = this.collectEntity(pairs, i + 1);
        const shape = this.parseLine(entity);
        if (shape) {
          shapes.push(shape);
        }
        i += entity.length;
      } else if (type === 'LWPOLYLINE') {
        const entity = this.collectEntity(pairs, i + 1);
        const shape = this.parseLwPolyline(entity);
        if (shape) {
          shapes.push(shape);
        }
        i += entity.length;
      } else if (type === 'POLYLINE') {
        const parsed = this.parsePolyline(pairs, i + 1);
        if (parsed.shape) {
          shapes.push(parsed.shape);
        }
        i = parsed.nextIndex;
      } else if (type === 'CIRCLE') {
        const entity = this.collectEntity(pairs, i + 1);
        const shape = this.parseCircle(entity);
        if (shape) {
          shapes.push(shape);
        }
        i += entity.length;
      } else if (type === 'ARC') {
        const entity = this.collectEntity(pairs, i + 1);
        const shape = this.parseArc(entity);
        if (shape) {
          shapes.push(shape);
        }
        i += entity.length;
      } else if (type === 'ELLIPSE') {
        const entity = this.collectEntity(pairs, i + 1);
        const shape = this.parseEllipse(entity);
        if (shape) {
          shapes.push(shape);
        }
        i += entity.length;
      } else if (type === 'SPLINE') {
        const entity = this.collectEntity(pairs, i + 1);
        const shape = this.parseSpline(entity);
        if (shape) {
          shapes.push(shape);
        }
        i += entity.length;
      } else if (type === '3DFACE' || type === 'TRACE') {
        const entity = this.collectEntity(pairs, i + 1);
        const shape = this.parseFace(entity);
        if (shape) {
          shapes.push(shape);
        }
        i += entity.length;
      } else if (type === 'POINT') {
        const entity = this.collectEntity(pairs, i + 1);
        const shape = this.parsePoint(entity);
        if (shape) {
          shapes.push(shape);
        }
        i += entity.length;
      } else if (type === 'TEXT' || type === 'MTEXT') {
        const entity = this.collectEntity(pairs, i + 1);
        const shape = this.parseText(entity);
        if (shape) {
          shapes.push(shape);
        }
        i += entity.length;
      } else if (type === 'INSERT') {
        const entity = this.collectEntity(pairs, i + 1);
        const insertShapes = this.parseInsert(entity, blocks);
        if (insertShapes.length > 0) {
          shapes.push(...insertShapes);
        } else {
          unsupportedCount++;
        }
        i += entity.length;
      } else if (this.isEntityType(type)) {
        unsupportedCount++;
      }
    }

    return { shapes, unsupportedCount };
  }

  private collectEntity(pairs: Array<{ code: string; value: string }>, startIndex: number): Array<{ code: string; value: string }> {
    const entity = [];
    for (let i = startIndex; i < pairs.length; i++) {
      if (pairs[i].code === '0') {
        break;
      }
      entity.push(pairs[i]);
    }
    return entity;
  }

  private parseLine(entity: Array<{ code: string; value: string }>): DxfShape {
    const x1 = this.getNumber(entity, '10');
    const y1 = this.getNumber(entity, '20');
    const x2 = this.getNumber(entity, '11');
    const y2 = this.getNumber(entity, '21');
    if ([x1, y1, x2, y2].some(value => value === null)) {
      return null;
    }

    return {
      type: 'line',
      points: [
        { x: x1, y: -y1 },
        { x: x2, y: -y2 },
      ],
    };
  }

  private parseLwPolyline(entity: Array<{ code: string; value: string }>): DxfShape {
    const points = [];
    let currentX: number = null;
    const flags = this.getNumber(entity, '70') || 0;

    entity.forEach(pair => {
      if (pair.code === '10') {
        currentX = Number(pair.value);
      } else if (pair.code === '20' && currentX !== null) {
        points.push({ x: currentX, y: -Number(pair.value) });
        currentX = null;
      }
    });

    if (points.length < 2) {
      return null;
    }

    return {
      type: 'polyline',
      points,
      closed: (flags & 1) === 1,
    };
  }

  private parsePolyline(pairs: Array<{ code: string; value: string }>, startIndex: number): { shape: DxfShape; nextIndex: number } {
    const points = [];
    let nextIndex = startIndex;
    let closed = false;

    for (let i = startIndex; i < pairs.length; i++) {
      const pair = pairs[i];
      if (pair.code === '70') {
        closed = (Number(pair.value) & 1) === 1;
      }

      if (pair.code === '0' && pair.value.toUpperCase() === 'VERTEX') {
        const vertex = this.collectEntity(pairs, i + 1);
        const x = this.getNumber(vertex, '10');
        const y = this.getNumber(vertex, '20');
        if (x !== null && y !== null) {
          points.push({ x, y: -y });
        }
        i += vertex.length;
      } else if (pair.code === '0' && pair.value.toUpperCase() === 'SEQEND') {
        nextIndex = i;
        break;
      }
    }

    return {
      shape: points.length >= 2 ? { type: 'polyline', points, closed } : null,
      nextIndex,
    };
  }

  private parseCircle(entity: Array<{ code: string; value: string }>): DxfShape {
    const x = this.getNumber(entity, '10');
    const y = this.getNumber(entity, '20');
    const r = this.getNumber(entity, '40');
    if ([x, y, r].some(value => value === null)) {
      return null;
    }

    return { type: 'circle', x, y: -y, r };
  }

  private parseArc(entity: Array<{ code: string; value: string }>): DxfShape {
    const x = this.getNumber(entity, '10');
    const y = this.getNumber(entity, '20');
    const r = this.getNumber(entity, '40');
    const startAngle = this.getNumber(entity, '50');
    const endAngle = this.getNumber(entity, '51');
    if ([x, y, r, startAngle, endAngle].some(value => value === null)) {
      return null;
    }

    return { type: 'arc', x, y: -y, r, startAngle, endAngle };
  }

  private parseEllipse(entity: Array<{ code: string; value: string }>): DxfShape {
    const centerX = this.getNumber(entity, '10');
    const centerY = this.getNumber(entity, '20');
    const majorX = this.getNumber(entity, '11');
    const majorY = this.getNumber(entity, '21');
    const ratio = this.getNumber(entity, '40') || 1;
    const startParam = this.getNumber(entity, '41');
    const endParam = this.getNumber(entity, '42');

    if ([centerX, centerY, majorX, majorY].some(value => value === null)) {
      return null;
    }

    const start = startParam !== null ? startParam : 0;
    const end = endParam !== null ? endParam : Math.PI * 2;
    const majorLength = Math.sqrt(majorX * majorX + majorY * majorY);
    const angle = Math.atan2(majorY, majorX);
    const points = [];
    const steps = 72;
    const delta = end >= start ? end - start : (Math.PI * 2 - start + end);

    for (let i = 0; i <= steps; i++) {
      const t = start + delta * (i / steps);
      const xLocal = majorLength * Math.cos(t);
      const yLocal = majorLength * ratio * Math.sin(t);
      const x = centerX + xLocal * Math.cos(angle) - yLocal * Math.sin(angle);
      const y = centerY + xLocal * Math.sin(angle) + yLocal * Math.cos(angle);
      points.push({ x, y: -y });
    }

    return points.length >= 2 ? { type: 'polyline', points, closed: delta >= Math.PI * 2 - 0.001 } : null;
  }

  private parseSpline(entity: Array<{ code: string; value: string }>): DxfShape {
    const points = [];
    let currentX: number = null;

    entity.forEach(pair => {
      if (pair.code === '10') {
        currentX = Number(pair.value);
      } else if (pair.code === '20' && currentX !== null) {
        points.push({ x: currentX, y: -Number(pair.value) });
        currentX = null;
      }
    });

    return points.length >= 2 ? { type: 'polyline', points } : null;
  }

  private parseFace(entity: Array<{ code: string; value: string }>): DxfShape {
    const points = [];
    [1, 2, 3, 4].forEach(index => {
      const x = this.getNumber(entity, String(9 + index));
      const y = this.getNumber(entity, String(19 + index));
      if (x !== null && y !== null) {
        points.push({ x, y: -y });
      }
    });

    const uniquePoints = points.filter((point, index) =>
      points.findIndex(item => item.x === point.x && item.y === point.y) === index
    );

    return uniquePoints.length >= 2 ? { type: 'polyline', points: uniquePoints, closed: uniquePoints.length >= 3 } : null;
  }

  private parsePoint(entity: Array<{ code: string; value: string }>): DxfShape {
    const x = this.getNumber(entity, '10');
    const y = this.getNumber(entity, '20');
    if ([x, y].some(value => value === null)) {
      return null;
    }

    return { type: 'point', x, y: -y, r: 1 };
  }

  private parseText(entity: Array<{ code: string; value: string }>): DxfShape {
    const x = this.getNumber(entity, '10');
    const y = this.getNumber(entity, '20');
    const height = this.getNumber(entity, '40') || 10;
    const textPair = entity.find(pair => pair.code === '1' || pair.code === '3');
    if (x === null || y === null || !textPair || !textPair.value) {
      return null;
    }

    return {
      type: 'text',
      x,
      y: -y,
      text: textPair.value,
      height,
    };
  }

  private parseInsert(entity: Array<{ code: string; value: string }>, blocks: { [name: string]: DxfShape[] }): DxfShape[] {
    const namePair = entity.find(pair => pair.code === '2');
    const blockName = namePair && namePair.value;
    const blockShapes = blockName && blocks[blockName] ? blocks[blockName] : [];

    if (blockShapes.length === 0) {
      return [];
    }

    const x = this.getNumber(entity, '10') || 0;
    const y = this.getNumber(entity, '20') || 0;
    const scaleX = this.getNumber(entity, '41') || 1;
    const scaleY = this.getNumber(entity, '42') || scaleX;
    const rotation = this.getNumber(entity, '50') || 0;

    return blockShapes.map(shape => this.transformShape(shape, x, -y, scaleX, scaleY, -rotation));
  }

  private transformShape(shape: DxfShape, x: number, y: number, scaleX: number, scaleY: number, rotation: number): DxfShape {
    const transformed = Object.assign({}, shape);

    if (shape.points) {
      transformed.points = shape.points.map(point => this.transformPoint(point, x, y, scaleX, scaleY, rotation));
    }

    if (shape.x !== undefined && shape.y !== undefined) {
      const point = this.transformPoint({ x: shape.x, y: shape.y }, x, y, scaleX, scaleY, rotation);
      transformed.x = point.x;
      transformed.y = point.y;
    }

    if (shape.r !== undefined) {
      transformed.r = shape.r * Math.max(Math.abs(scaleX), Math.abs(scaleY));
    }

    if (shape.height !== undefined) {
      transformed.height = shape.height * Math.max(Math.abs(scaleX), Math.abs(scaleY));
    }

    if (shape.startAngle !== undefined) {
      transformed.startAngle = shape.startAngle + rotation;
    }

    if (shape.endAngle !== undefined) {
      transformed.endAngle = shape.endAngle + rotation;
    }

    return transformed;
  }

  private transformPoint(
    point: { x: number; y: number },
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    rotation: number,
  ): { x: number; y: number } {
    const scaledX = point.x * scaleX;
    const scaledY = point.y * scaleY;
    const radians = rotation * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    return {
      x: x + scaledX * cos - scaledY * sin,
      y: y + scaledX * sin + scaledY * cos,
    };
  }

  private getNumber(entity: Array<{ code: string; value: string }>, code: string): number {
    const pair = entity.find(item => item.code === code);
    if (!pair) {
      return null;
    }

    const value = Number(pair.value);
    return isNaN(value) ? null : value;
  }

  getPolylinePoints(shape: DxfShape): string {
    const points = shape.points || [];
    const allPoints = shape.closed && points.length > 0 ? points.concat([points[0]]) : points;
    return allPoints.map(point => `${point.x},${point.y}`).join(' ');
  }

  getArcPath(shape: DxfShape): string {
    const start = this.polarPoint(shape.x, shape.y, shape.r, shape.startAngle);
    const end = this.polarPoint(shape.x, shape.y, shape.r, shape.endAngle);
    const delta = (shape.endAngle - shape.startAngle + 360) % 360;
    const largeArc = delta > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${shape.r} ${shape.r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  }

  private polarPoint(x: number, y: number, r: number, angle: number): { x: number; y: number } {
    const radians = angle * Math.PI / 180;
    return {
      x: x + Math.cos(radians) * r,
      y: y - Math.sin(radians) * r,
    };
  }

  private updateViewBox(): void {
    const bounds = this.getBounds();
    if (!bounds) {
      this.baseViewBox = { x: 0, y: 0, width: 100, height: 100 };
      this.zoomLevel = 1;
      this.viewBox = '0 0 100 100';
      return;
    }

    const width = Math.max(bounds.maxX - bounds.minX, 1);
    const height = Math.max(bounds.maxY - bounds.minY, 1);
    const padding = Math.max(width, height) * 0.05;
    this.baseViewBox = {
      x: bounds.minX - padding,
      y: bounds.minY - padding,
      width: width + padding * 2,
      height: height + padding * 2,
    };
    this.zoomLevel = 1;
    this.applyZoomViewBox();
  }

  private applyZoomViewBox(): void {
    const width = this.baseViewBox.width / this.zoomLevel;
    const height = this.baseViewBox.height / this.zoomLevel;
    const centerX = this.baseViewBox.x + this.baseViewBox.width / 2;
    const centerY = this.baseViewBox.y + this.baseViewBox.height / 2;
    this.viewBox = `${centerX - width / 2} ${centerY - height / 2} ${width} ${height}`;
  }

  private getBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const points = [];

    this.shapes.forEach(shape => {
      if (shape.points) {
        points.push(...shape.points);
      } else if (shape.type === 'circle' || shape.type === 'arc') {
        points.push(
          { x: shape.x - shape.r, y: shape.y - shape.r },
          { x: shape.x + shape.r, y: shape.y + shape.r },
        );
      } else if (shape.x !== undefined && shape.y !== undefined) {
        points.push({ x: shape.x, y: shape.y });
      }
    });

    if (points.length === 0) {
      return null;
    }

    return {
      minX: Math.min(...points.map(point => point.x)),
      minY: Math.min(...points.map(point => point.y)),
      maxX: Math.max(...points.map(point => point.x)),
      maxY: Math.max(...points.map(point => point.y)),
    };
  }

  private isEntityType(type: string): boolean {
    return [
      '3DFACE',
      'ARC',
      'ATTDEF',
      'ATTRIB',
      'CIRCLE',
      'ELLIPSE',
      'HATCH',
      'INSERT',
      'LEADER',
      'LINE',
      'LWPOLYLINE',
      'MLINE',
      'MTEXT',
      'POINT',
      'POLYLINE',
      'RAY',
      'SPLINE',
      'TEXT',
      'TRACE',
      'VERTEX',
      'XLINE',
    ].indexOf(type) >= 0;
  }
}
