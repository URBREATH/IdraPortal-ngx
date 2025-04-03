import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
// import * as hljs from 'highlight.js';

@Component({
  selector: 'ngd-code-block',
  styleUrls: ['./code-block.component.scss'],
  template: `
    <div class="container">
      <div class="lines">
        <span *ngFor="let line of lines">{{ line }}</span>
      </div>
      <pre contenteditable="true" spellcheck="false" (input)="updateCode()"><code class="hljs" [innerHTML]="code"></code></pre>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgdCodeBlockComponent {

  @Input() path = '';
  @Input() firstLine: number;
  @Input() lastLine: number;

  updateCode() {
    console.log('updateCode');
    let currentCode = document.querySelector('code').textContent;
    //  if empty, set to default
    if (currentCode !== '') {
      // const highlighted = hljs.highlightAuto(currentCode, ['ts', 'html', 'scss', 'nginx']).value;
      // this.code = this.getVisible(highlighted);
      this.lines = this.createLines(this.code);
    }
  }

  @Input('code')
  set rawCode(value) {
    // const highlighted = hljs.highlightAuto(value, ['ts', 'html', 'scss', 'nginx']).value;
    // this.code = this.getVisible(highlighted);
    this.lines = this.createLines(this.code);
  }

  code: SafeHtml;
  lines: number[] = [];

  constructor() {
  }

  getVisible(code): string {
    return code
      .split('\n')
      .slice(this.firstLine - 1, this.lastLine)
      .join('\n');
  }

  createLines(code): number[] {
    const length = code.split('\n').length;
    return Array(length).fill(0).map((_, i) => i + (this.firstLine || 1));
  }
}