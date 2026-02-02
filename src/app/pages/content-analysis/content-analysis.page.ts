import { Component, OnInit } from '@angular/core';
import { GeminiService } from '../../services/gemini.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { TutorialService, Course, TutorialSection } from '../../services/tutorial.service';

@Component({
  selector: 'app-content-analysis',
  templateUrl: './content-analysis.page.html',
  styleUrls: ['./content-analysis.page.scss'],
  standalone: false
})
export class ContentAnalysisPage implements OnInit {
  apiKey: string = '';
  inputContent: string = '';
  enhancedContent: string = '';
  isApiConfigured: boolean = false;
  isAnalyzing: boolean = false;

  // Batch Processing
  courses: Course[] = [];
  selectedCourseId: string = '';
  chaptersToProcess: any[] = [];
  processedChapters: any[] = [];
  isBatchMode: boolean = false;
  batchProgress: number = 0;
  isBatchRunning: boolean = false;

  constructor(
    private geminiService: GeminiService,
    private tutorialService: TutorialService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.loadCourses();

    // Priority 1: Use key from environment
    if (environment.geminiApiKey) {
      this.apiKey = environment.geminiApiKey;
      this.geminiService.setApiKey(this.apiKey);
      this.isApiConfigured = true;
    } 
    // Priority 2: Fallback to local storage
    else {
      const storedKey = localStorage.getItem('GEMINI_API_KEY');
      if (storedKey) {
        this.apiKey = storedKey;
        this.geminiService.setApiKey(this.apiKey);
        this.isApiConfigured = true;
      }
    }
  }

  loadCourses() {
    this.tutorialService.getCourses().subscribe(courses => {
      this.courses = courses;
    });
  }

  onCourseChange() {
    if (!this.selectedCourseId) return;
    
    const course = this.courses.find(c => c.id === this.selectedCourseId);
    if (course) {
      this.tutorialService.getMenu(course.file).subscribe(sections => {
        this.chaptersToProcess = [];
        sections.forEach(section => {
          section.items.forEach(item => {
            this.chaptersToProcess.push({
              title: item.title,
              file: item.file,
              status: 'pending',
              enhancedContent: ''
            });
          });
        });
      });
    }
  }

  async runBatchAnalysis() {
    if (this.chaptersToProcess.length === 0) {
      this.showToast('No chapters found to process', 'warning');
      return;
    }

    this.isBatchRunning = true;
    this.processedChapters = [];
    let count = 0;

    for (let chapter of this.chaptersToProcess) {
      if (!this.isBatchRunning) break;
      
      chapter.status = 'processing';
      try {
        // Fetch raw content
        const rawContent = await this.tutorialService.getContent(chapter.file).toPromise();
        if (rawContent) {
          // Analyze with Gemini
          const enhanced = await this.geminiService.analyzeAndEnhanceContent(rawContent);
          chapter.enhancedContent = enhanced;
          chapter.status = 'completed';
          this.processedChapters.push(chapter);
          
          // Add a small pause between requests to be safe
          await new Promise(res => setTimeout(res, 1500));
        } else {
          chapter.status = 'error';
        }
      } catch (error) {
        console.error(`Error processing ${chapter.title}:`, error);
        chapter.status = 'error';
      }
      
      count++;
      this.batchProgress = (count / this.chaptersToProcess.length) * 100;
    }
    
    this.isBatchRunning = false;
    this.showToast('Batch analysis completed!', 'success');
  }

  stopBatch() {
    this.isBatchRunning = false;
  }

  downloadAllEnhanced() {
    if (this.processedChapters.length === 0) return;
    
    const combined = this.processedChapters
      .map(c => `# ${c.title}\n\n${c.enhancedContent}\n\n---\n\n`)
      .join('');
      
    const blob = new Blob([combined], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.selectedCourseId}_enhanced_content.md`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  saveApiKey() {
    if (!this.apiKey.trim()) {
      this.showToast('Please enter a valid API key', 'warning');
      return;
    }
    localStorage.setItem('GEMINI_API_KEY', this.apiKey);
    this.geminiService.setApiKey(this.apiKey);
    this.isApiConfigured = true;
    this.showToast('API Key configured successfully!', 'success');
  }

  resetApiKey() {
    this.isApiConfigured = false;
    // We don't necessarily clear it from storage immediately to allow correction
  }

  async runAnalysis() {
    if (!this.inputContent.trim()) {
      this.showToast('Please enter some content to analyze', 'warning');
      return;
    }

    const loader = await this.loadingCtrl.create({
      message: 'Gemini is analyzing and enhancing your content...',
      spinner: 'bubbles'
    });
    await loader.present();

    this.isAnalyzing = true;
    try {
      this.enhancedContent = await this.geminiService.analyzeAndEnhanceContent(this.inputContent);
      this.showToast('Content enhanced successfully!', 'success');
    } catch (error: any) {
      console.error(error);
      this.showToast('Error: ' + (error.message || 'Failed to analyze content'), 'danger');
    } finally {
      this.isAnalyzing = false;
      loader.dismiss();
    }
  }

  copyToClipboard() {
    if (!this.enhancedContent) return;
    navigator.clipboard.writeText(this.enhancedContent);
    this.showToast('Enhanced content copied to clipboard!', 'success');
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit for now
      this.showToast('File is too large. Please select a smaller file.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.inputContent = e.target.result;
      this.showToast('File loaded successfully!', 'success');
      // Optional: Auto-run analysis? No, let user review first.
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      this.showToast('Error reading file', 'danger');
    };
    reader.readAsText(file);
  }

  downloadSingleEnhanced() {
    if (!this.enhancedContent) return;
    
    const blob = new Blob([this.enhancedContent], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enhanced_content_${new Date().getTime()}.md`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
