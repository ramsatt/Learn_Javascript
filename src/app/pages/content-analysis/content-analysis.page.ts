import { Component, OnInit } from '@angular/core';
import { GeminiService } from '../../services/gemini.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { TutorialService, Course, TutorialSection } from '../../services/tutorial.service';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';

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
    private loadingCtrl: LoadingController,
    private firestore: Firestore
  ) { }

  ngOnInit() {
    this.loadCourses();

    // Priority 1: Use key from environment (dev only now mostly empty)
    // @ts-ignore
    if (environment.geminiApiKey) {
      // @ts-ignore
      this.apiKey = environment.geminiApiKey;
      this.geminiService.setApiKey(this.apiKey);
      this.isApiConfigured = true;
    } 
    // Priority 2: Fallback to local storage (optional manual override)
    else {
      const storedKey = localStorage.getItem('GEMINI_API_KEY');
      if (storedKey) {
        this.apiKey = storedKey;
        this.geminiService.setApiKey(this.apiKey);
        this.isApiConfigured = true;
      } else {
        // Attempt auto-configure from Remote Config via service
        this.geminiService.getApiKey().then(key => {
          if (key) {
            this.apiKey = key;
            this.isApiConfigured = true;
          }
        });
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
        
        // Immediately load progress to show current state
        this.loadAnalysisProgress();
      });
    }
  }

  async loadAnalysisProgress() {
    if (!this.selectedCourseId) return;

    const progressDocRef = doc(this.firestore, `content_analysis_status/${this.selectedCourseId}`);
    try {
      const docSnap = await getDoc(progressDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.chaptersToProcess.forEach(ch => {
          if (data[ch.title] === 'completed') {
            ch.status = 'completed';
            ch.skipped = true; 
          }
        });
        // Update batch progress for UI
        const completedCount = this.chaptersToProcess.filter(c => c.status === 'completed').length;
        if (this.chaptersToProcess.length > 0) {
            this.batchProgress = (completedCount / this.chaptersToProcess.length) * 100;
        }
      }
    } catch (e) {
      console.error('Error loading progress', e);
    }
  }

  async runBatchAnalysis() {
    if (!this.selectedCourseId) return;
    if (this.chaptersToProcess.length === 0) {
      this.showToast('No chapters found to process', 'warning');
      return;
    }

    this.isBatchRunning = true;
    this.processedChapters = [];
    let count = 0;

    // Load progress from Firestore to Resume
    await this.loadAnalysisProgress();

    const progressDocRef = doc(this.firestore, `content_analysis_status/${this.selectedCourseId}`);

    // Filter only pending
    const pendingChapters = this.chaptersToProcess.filter(c => c.status !== 'completed');
    
    if (pendingChapters.length === 0) {
       this.showToast('All chapters already analyzed!', 'success');
       this.isBatchRunning = false;
       this.batchProgress = 100;
       return;
    }

    for (let chapter of pendingChapters) {
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
          
          // 1. Update Firestore Status
          await setDoc(progressDocRef, { 
            [chapter.title]: 'completed',
            lastUpdated: new Date()
          }, { merge: true });

          // 2. Trigger "Save" (Download)
          this.downloadChapterFile(chapter, this.selectedCourseId);
          
          // Add a small pause between requests to be safe from rate limits
          await new Promise(res => setTimeout(res, 2000));
        } else {
          chapter.status = 'error';
        }
      } catch (error) {
        console.error(`Error processing ${chapter.title}:`, error);
        chapter.status = 'error';
        // Continue to next even if one fails? Yes.
      }
      
      count++;
      // Calculate progress based on total items
      const completedCount = this.chaptersToProcess.filter(c => c.status === 'completed').length;
      this.batchProgress = (completedCount / this.chaptersToProcess.length) * 100;
    }
    
    this.isBatchRunning = false;
    this.showToast('Batch analysis run completed!', 'success');
  }

  downloadChapterFile(chapter: any, courseId: string) {
    // Construct filename: assets/contents/{course}/{topic}.md
    // We sanitize the title for filename
    const safeTitle = chapter.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    // Simulate query path structure requested
    const filename = `assets_contents_${courseId}_${safeTitle}.md`;
    
    const blob = new Blob([chapter.enhancedContent], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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
