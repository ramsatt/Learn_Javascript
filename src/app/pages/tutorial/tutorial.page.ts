
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TutorialService } from '../../services/tutorial.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AdmobService } from '../../services/admob.service';
import { SeoService } from '../../services/seo.service';
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
export class TutorialPage implements OnInit, OnDestroy {
  content: SafeHtml | string = "";
  title: string = "Tutorial";
  loading = true;
  showSuccess = false;
  xpAwarded = 0;
  
  // Two Pan Layout Data
  menuData: any[] = [];
  currentFile: string = "";
  isSidebarOpen = false; // Closed by default, especially for mobile
  
  prevFile: any = null;
  nextFile: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public tutorialService: TutorialService,
    private sanitizer: DomSanitizer,
    private admobService: AdmobService,
    private seoService: SeoService
  ) { }

  ngOnInit() {
    // Open sidebar by default only on desktop
    if (window.innerWidth > 900) {
      this.isSidebarOpen = true;
    }
    
    this.loadMenu();
    this.route.paramMap.subscribe(params => {
        const file = params.get('file');
        if (file) {
            this.currentFile = file;
            this.title = file.replace('.html', '').replace(/_/g, ' ').toUpperCase();
            this.loadContent(file);
            this.updateNavButtons();
            
            // Update SEO meta tags for tutorial
            this.seoService.generateTutorialMetaTags(this.title, 'Programming Tutorial', file);
        }
    });
  }

  ngOnDestroy() {
    // Hide banner when leaving the page
    this.admobService.hideBanner();
  }

  loadMenu() {
    this.tutorialService.getMenu().subscribe(data => {
        this.menuData = data;
        // Expand the section containing the current file
        this.menuData.forEach(section => {
            if (section.items.some((i: any) => i.file === this.currentFile)) {
                section.expanded = true;
            }
        });
        this.updateNavButtons();
    });
  }

  updateNavButtons() {
    if (!this.menuData || this.menuData.length === 0 || !this.currentFile) return;

    // Flatten all items into a single array to find siblings across sections
    const allItems: any[] = [];
    this.menuData.forEach(section => {
        section.items.forEach((item: any) => {
            allItems.push(item);
        });
    });

    const currentIndex = allItems.findIndex(item => item.file === this.currentFile);
    
    this.prevFile = currentIndex > 0 ? allItems[currentIndex - 1] : null;
    this.nextFile = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;
  }

  toggleSection(section: any) {
    section.expanded = !section.expanded;
  }

  isLessonActive(file: string): boolean {
    return this.currentFile === file;
  }
  
  toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
  }

  openLesson(file: string) {
      if (this.currentFile === file) return;
      
      // Close sidebar on mobile when navigating
      if (window.innerWidth <= 900) {
        this.isSidebarOpen = false;
      }
      
      this.router.navigate(['/tutorial', file]);
  }

  loadContent(file: string) {
    this.loading = true;
    this.tutorialService.getContent(file).subscribe({
      next: (html) => {
        this.content = this.sanitizer.bypassSecurityTrustHtml(html);
        this.loading = false;
          
        // Trigger highlight after view update
        setTimeout(() => {
             Prism.highlightAll();
             
             // Show banner ad only after content is loaded and visible
             // This ensures we comply with AdSense policy (ads only on pages with content)
             this.admobService.showBanner();
        }, 500);
      },
      error: (err) => {
        console.error(err);
        this.content = "<p>Error loading content.</p>";
        this.loading = false;
        // Don't show ads on error pages
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
      const isNextButton = anchor.classList.contains('w3-right') || anchor.innerText.toLowerCase().includes('next');

      if (href) {
        // Mark current as complete before moving to next
        if (isNextButton) {
            const currentFile = this.route.snapshot.paramMap.get('file');
            if (currentFile) this.tutorialService.markComplete(currentFile);
            
            // Show Interstitial Ad specifically for Next navigation
            this.admobService.showInterstitial();
        }

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

  goToNext() {
      if (this.nextFile) {
          this.tutorialService.markComplete(this.currentFile);
          this.admobService.showInterstitial();
          this.router.navigate(['/tutorial', this.nextFile.file]);
      }
  }

  goToPrev() {
      if (this.prevFile) {
          this.router.navigate(['/tutorial', this.prevFile.file]);
      }
  }

  goHome() {
    this.router.navigate(['/home'], { replaceUrl: true });
  }

  continueNext() {
      this.showSuccess = false;
      if (this.nextFile) {
          this.goToNext();
      } else {
          this.goHome();
      }
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
