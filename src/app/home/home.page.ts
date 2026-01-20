import { Component, OnInit } from '@angular/core';
import { TutorialService } from '../services/tutorial.service';
import { Router } from '@angular/router';

interface TutorialItem {
    title: string;
    file: string;
}

interface MenuSection {
    title: string;
    items: TutorialItem[];
    expanded?: boolean;
    progress?: number; // 0 to 100
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  menuData: MenuSection[] = [];

  constructor(private tutorialService: TutorialService, private router: Router) {}

  ngOnInit() {
      // Initial load
      this.loadMenuData();
  }

  ionViewWillEnter() {
      // Refresh progress when returning to the page
      if (this.menuData.length > 0) {
          this.updateProgress();
      } else {
          this.loadMenuData();
      }
  }

  loadMenuData() {
    this.tutorialService.getMenu().subscribe(data => {
      this.menuData = data;
      this.updateProgress();
    });
  }

  updateProgress() {
      this.menuData.forEach(section => {
          section.progress = this.tutorialService.getProgress(section.items);
      });
  }
  
  // Helper for circular progress
  getCircleDash(progress: number): string {
      const radius = 18;
      const circum = 2 * Math.PI * radius; // ~113
      const offset = circum - ((progress || 0) / 100) * circum;
      return `${offset}`;
  }

  toggleSection(section: MenuSection) {
      if (!section.items || section.items.length === 0) return;
      
      // Navigate to Chapter List
      this.router.navigate(['/chapter-list', section.title]);
  }

  // Explicit back navigation to Dashboard
  goHome() {
      this.router.navigate(['/home'], { replaceUrl: true });
  }

  openTutorial(file: string) {
    // Navigate to the tutorial page
    this.router.navigate(['/tutorial', file]);
    // Blur to remove focus highlight
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }
}
