import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import * as Prism from 'prismjs';

@Component({
  selector: 'app-code-block',
  templateUrl: './code-block.component.html',
  styleUrls: ['./code-block.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class CodeBlockComponent implements OnInit, OnChanges {
  @Input() code: string = '';
  @Input() language: string = 'html';
  @Input() showHeader: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() title: string = 'Example';
  
  @Output() tryIt = new EventEmitter<string>();
  
  highlightedCode: string = '';
  isCopied: boolean = false;
  lines: number[] = [];
  
  ngOnInit() {
    this.highlight();
  }
  
  ngOnChanges() {
    this.highlight();
  }
  
  highlight() {
    if (this.code) {
      const grammar = Prism.languages[this.language] || Prism.languages['plaintext'];
      this.highlightedCode = Prism.highlight(this.code, grammar, this.language);
      
      // Calculate lines
      const lineCount = this.code.split('\n').length;
      this.lines = Array(lineCount).fill(0);
    }
  }
  
  copyCode() {
    navigator.clipboard.writeText(this.code).then(() => {
      this.isCopied = true;
      setTimeout(() => this.isCopied = false, 2000);
    });
  }
  
  tryItYourself() {
    this.tryIt.emit(this.code);
  }
}
