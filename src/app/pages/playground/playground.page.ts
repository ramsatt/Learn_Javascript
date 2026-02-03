import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { ToastController } from '@ionic/angular';
import { TutorialService } from '../../services/tutorial.service';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.page.html',
  styleUrls: ['./playground.page.scss'],
  standalone: false
})
export class PlaygroundPage implements OnInit, AfterViewInit {
  
  @ViewChild('preElement') preElement!: ElementRef;
  
  code: string = '';
  highlightedCode: SafeHtml = '';
  activeTab: 'editor' | 'result' = 'editor';
  iframeSrc: SafeResourceUrl | null = null;
  
  defaultHtml = `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: sans-serif; text-align: center; padding-top: 50px; }
  h1 { color: #4f46e5; }
  .card {
    background: #f8fafc;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    display: inline-block;
  }
  button {
    background: #4f46e5;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    margin-top: 15px;
    cursor: pointer;
  }
</style>
</head>
<body>
  <div class="card">
    <h1>Hello from Coding Tamilan!</h1>
    <p>Edit this code and click 'Run Result' to see changes live.</p>
    <button>Click Me</button>
  </div>
</body>
</html>`;

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private toastCtrl: ToastController,
    private tutorialService: TutorialService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      // Check service first
      const injectedCode = this.tutorialService.getPlaygroundCode();
      
      if (injectedCode) {
          this.code = injectedCode;
      } else {
          this.code = this.defaultHtml;
      }
      // Run initially
      this.updateHighlight();
      this.runCode();
    });
  }

  ngAfterViewInit() {
    this.updateHighlight();
  }

  updateHighlight() {
    // Escape HTML for display in the code block
    const escaped = this.code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    // Highlight using Prism
    const highlighted = Prism.highlight(this.code, Prism.languages['html'], 'html');
    this.highlightedCode = this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  onCodeInput(event: any) {
    this.code = event.target.value;
    this.updateHighlight();
  }

  runCode() {
    // Basic sanitization/wrapping could happen here
    // For a playground, we often want to allow "unsafe" scripts so the user can learn
    // We use bypassSecurityTrustResourceUrl with a blob or data URI
    
    const blob = new Blob([this.code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    
    // Switch to result tab on mobile automatically when run
    if (window.innerWidth < 768) {
      this.activeTab = 'result';
    }
  }

  handleTab(e: any) {
    e.preventDefault();
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    
    // Insert 2 spaces
    this.code = this.code.substring(0, start) + '  ' + this.code.substring(end);
    
    // Update model and highlighting manually
    this.updateHighlight();

    setTimeout(() => {
      e.target.selectionStart = e.target.selectionEnd = start + 2;
    });
  }

  syncScroll(event: any) {
    if (this.preElement && this.preElement.nativeElement) {
      this.preElement.nativeElement.scrollTop = event.target.scrollTop;
      this.preElement.nativeElement.scrollLeft = event.target.scrollLeft;
    }
  }

  copyCode() {
    navigator.clipboard.writeText(this.code);
    this.showToast('Code copied to clipboard!');
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      position: 'bottom',
      color: 'dark'
    });
    toast.present();
  }
}
