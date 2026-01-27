
import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TutorialService } from '../../services/tutorial.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AdmobService } from '../../services/admob.service';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // html

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.page.html',
  styleUrls: ['./tutorial.page.scss'],
  standalone: false,
})
export class TutorialPage implements OnInit {
  content: SafeHtml | string = "";
  title: string = "Tutorial";
  loading = true;
  showSuccess = false;
  xpAwarded = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tutorialService: TutorialService,
    private sanitizer: DomSanitizer,
    private admobService: AdmobService
  ) { }

  ngOnInit() {
    const file = this.route.snapshot.paramMap.get('file');
    if (file) {
      // Basic title extraction from filename
      this.title = file.replace('.html', '').replace(/_/g, ' ').toUpperCase();
      this.loadContent(file);
    }
  }

  loadContent(file: string) {
    this.loading = true;
    this.tutorialService.getContent(file).subscribe({
      next: (html) => {
        this.content = this.sanitizer.bypassSecurityTrustHtml(html);
        this.loading = false;
        this.loading = false;
          
        // Trigger highlight after view update
        setTimeout(() => {
             Prism.highlightAll();
        }, 100);
      },
      error: (err) => {
        console.error(err);
        this.content = "<p>Error loading content.</p>";
        this.loading = false;
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Check if the click is on an anchor tag or bubbled up to one
    const anchor = target.closest('a');
    
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href) {
        // Check if it's an external link
        if (href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:')) {
            // Allow default behavior (open in new tab possibly if target=_blank)
            return;
        }
        
        // Internal link like "js_whereto.html" or "../default.html"
        event.preventDefault();
        
        let file = href;
        if (file.includes('default.html') && file.includes('../')) {
             // likely home
             this.router.navigate(['/home']);
             return;
        }
        
        // Remove ./
        if (file.startsWith('./')) file = file.substring(2);
        
        // Navigate
        if (file.startsWith('#')) {
            return;
        }
        
        this.router.navigate(['/tutorial', file]);
      }
    }
  }
  goHome() {
    this.router.navigate(['/home'], { replaceUrl: true });
  }

  continueNext() {
      this.showSuccess = false;
      this.goHome(); // Or find next chapter? For now go home/map.
  }

  completeLesson() {
      const file = this.route.snapshot.paramMap.get('file');
      if (!file) return;

      const isNewCompletion = this.tutorialService.markComplete(file);
      
      // Show Interstitial Ad on completion
      this.admobService.showInterstitial();

      if (isNewCompletion) {
          this.xpAwarded = 50;
          this.showSuccess = true;
      } else {
          // Already completed, just go back or show a toast?
          // For now, let's just go back if already done, OR show the success modal anyway without XP?
          // User asked "mark the lesson completed manually".
          // If already done, maybe just go back to map or show "Great work review!"
          this.goHome();
      }
  }
}
