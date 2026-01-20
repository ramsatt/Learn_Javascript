
import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TutorialService } from '../../services/tutorial.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tutorialService: TutorialService,
    private sanitizer: DomSanitizer
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
          
        // Mark as complete when content successfully loads
        this.tutorialService.markComplete(file);

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
}
