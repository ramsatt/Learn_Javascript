
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
        // We'll trust HTML but we also want to manipulate it if possible.
        // DomSanitizer bypass prevents manipulation by string ops easily afterwards if not careful.
        // Let's modify the string BEFORE trusting it.
        
        let modifiedHtml = html;
        
        // Inject "Try it" button logic
        // We can use a regex to find <div class="w3-example">...</div> or similar blocks from W3Schools structure
        // Or generic <pre><code> blocks if that's what we have.
        // Assuming W3C style 'w3-example' for now or standard pre/code.
        
        // Simple injection: Append a button after every <pre> block for now
        // A robust parser would be better but regex is faster for this context.
        
        // This regex looks for closing </pre> and appends a button
        // Note: This is a simple heuristic.
        // modifiedHtml = modifiedHtml.replace(/<\/pre>/g, '</pre><button class="try-btn" data-action="try-code">Try it Yourself</button>');
        
        this.content = this.sanitizer.bypassSecurityTrustHtml(modifiedHtml);
        this.loading = false;
          
        // Trigger highlight after view update
        setTimeout(() => {
             Prism.highlightAll();
             
             // 1. Find all example containers (w3-example matches the scraped source usually)
             // or generic pre elements
             // 1. Find all example containers (w3-example matches the scraped source usually)
             // or generic pre elements but be careful not to double add
             const examples = document.querySelectorAll('.w3-example, .w3-code, pre:not(.w3-code):not(.w3-example) code');
             
             examples.forEach((ex: any, index) => {
                 // Check if button already exists in this container or immediate sibling
                 if (ex.querySelector('.btn-try-it') || (ex.nextElementSibling && ex.nextElementSibling.classList.contains('btn-try-it'))) {
                     return;
                 }

                 // Create Button
                 const btn = document.createElement('button');
                 btn.className = 'btn-try-it';
                 btn.innerHTML = '<ion-icon name="code-slash-outline"></ion-icon> Try it Yourself';
                 btn.style.cssText = 'margin-top: 10px; background: #04AA6D; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 500; font-family: "Segoe UI", Roboto, sans-serif;';
                 
                 // Add click handler
                 btn.onclick = (e) => {
                     e.stopPropagation();
                     // Extract code - preferring text content of code block
                     let codeText = ex.textContent || '';
                     
                     this.tutorialService.setPlaygroundCode(codeText);
                     this.router.navigate(['/playground']);
                 };
                 
                 // Append button: If it's a pre/code block, append AFTER it. If it's a container like w3-example, append INSIDE at bottom.
                 if (ex.tagName.toLowerCase() === 'pre' || ex.tagName.toLowerCase() === 'code') {
                     ex.parentNode?.insertBefore(btn, ex.nextSibling);
                 } else {
                     ex.appendChild(btn);
                 }
             });

             // Show banner ad
             this.admobService.showBanner();
        }, 500);
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
