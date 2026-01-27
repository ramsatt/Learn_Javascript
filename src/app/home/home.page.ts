import { Component, OnInit } from '@angular/core';
import { TutorialService } from '../services/tutorial.service';
import { ThemeService } from '../services/theme.service';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AdmobService } from '../services/admob.service';

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
  
  // Gamification Stats
  xp = 0;
  level = 1;
  currentStreak = 0;
  gems = 0;
  nextLevelXp = 100;
  progressToNextLevel = 0;

  // Continue Learning Logic
  lastModuleTitle = 'Start Learning';
  lastModuleProgress = 0;
  lastModuleTotal = 0;
  overallProgressText = '0/0';

  constructor(
    public tutorialService: TutorialService, 
    private router: Router,
    public themeService: ThemeService,
    private alertCtrl: AlertController,
    private admobService: AdmobService,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
      // Initial load
      this.loadMenuData();
  }

  ionViewWillEnter() {
      // Refresh progress when returning to the page
      this.refreshGamification();
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

  refreshGamification() {
      this.xp = this.tutorialService.xp;
      this.level = this.tutorialService.level;
      this.currentStreak = this.tutorialService.currentStreak;
      this.gems = this.tutorialService.gems;
      
      const next = this.tutorialService.getNextLevelXP();
      const currentLevelBase = this.tutorialService.level === 1 ? 0 : (this.tutorialService.level - 1) * 100 * 1.5; 
      // Simplified progress calc for visualization
      this.nextLevelXp = next;
      this.progressToNextLevel = (this.xp / next); 
  }

  updateProgress() {
      let totalItems = 0;
      let totalCompleted = 0;
      let lastActiveSection: MenuSection | null = null;
      let lastRecency = -1;

      this.menuData.forEach((section, index) => {
          section.progress = this.tutorialService.getProgress(section.items);
          
          if (section.items) {
             const sectionTotal = section.items.length;
             const sectionCompleted = section.items.filter(i => this.tutorialService.isComplete(i.file)).length;
             
             totalItems += sectionTotal;
             totalCompleted += sectionCompleted;

             // Logic to find 'Continue Learning' candidate
             // If section is started but not complete, it's a good candidate
             if (sectionCompleted > 0 && sectionCompleted < sectionTotal) {
                  lastActiveSection = section;
             }
          }
      });
      
      // If no active section found, default to the first one or the first incomplete one
      if (!lastActiveSection && this.menuData.length > 0) {
          lastActiveSection = this.menuData.find(s => (s.progress || 0) < 100) || this.menuData[0];
      }

      if (lastActiveSection) {
          this.lastModuleTitle = lastActiveSection.title;
          const completedCount = lastActiveSection.items.filter(i => this.tutorialService.isComplete(i.file)).length;
          this.lastModuleTotal = lastActiveSection.items.length;
          this.overallProgressText = `${completedCount}/${this.lastModuleTotal}`;
          // Width percentage
          this.lastModuleProgress = lastActiveSection.progress || 0;
      }
  }
  
  // Helper for circular progress
  getCircleDash(progress: number): string {
      const radius = 18;
      const circum = 2 * Math.PI * radius; // ~113
      const offset = circum - ((progress || 0) / 100) * circum;
      return `${offset}`;
  }

  async toggleSection(section: MenuSection, index: number = -1) {
      // 1. Check if locked
      if (index !== -1 && this.tutorialService.isModuleLocked(index)) {
          await this.promptUnlock(index);
          return;
      }

      if (!section.items || section.items.length === 0) return;
      
      // Navigate to Chapter List
      this.router.navigate(['/chapter-list', section.title]);
  }

  async promptUnlock(index: number) {
      const alert = await this.alertCtrl.create({
          header: 'Unlock Topic',
          message: 'Watch a short video to unlock the next 5 topics for free!',
          mode: 'ios',
          buttons: [
              {
                  text: 'Cancel',
                  role: 'cancel'
              },
              {
                  text: 'Watch Video',
                  handler: () => {
                      this.showRewardAd(index);
                  }
              }
          ]
      });
      await alert.present();
  }

  async showRewardAd(index: number) {
      const loading = await this.loadingCtrl.create({
          message: 'Loading Reward...',
          duration: 3000 // Fallback
      });
      await loading.present();

      try {
           // Show Ad
           await this.admobService.showReward();
           
           // In production, you would listen for the rewar event. 
           // For now, we assume if showReward completes (or even if it fails for test), we unlock.
           
           this.tutorialService.unlockNextSet(index);
           if (loading) await loading.dismiss();
           
      } catch (e) {
          if (loading) await loading.dismiss();
          console.error('Ad failed or skipped', e);
          // Fallback: unlock anyway for good UX if ad fails to load
           this.tutorialService.unlockNextSet(index);
      }
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

  continueToLast() {
      // Mock logic: Go to first incomplete or just a specific intro page
      this.router.navigate(['/tutorial', 'js_intro.html']); 
  }

  getModuleThumb(section: MenuSection, index: number) {
      // Use the helper logic (inlined for simplicity here since we can't easily import a fragment)
      const titleLower = section.title.toLowerCase();
      const gradients = [
        'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', // Blue Sky
        'linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%)', // Ice
        'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', // Silver
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Mint/Pink
        'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', // Soft Purple
        'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)', // Sunset
      ];
      
      if (titleLower.includes('basic')) return 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)';
      if (titleLower.includes('dom')) return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'; 
      if (titleLower.includes('versions')) return 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)';
      if (titleLower.includes('advanced')) return 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)';

      return gradients[index % gradients.length];
  }
}
