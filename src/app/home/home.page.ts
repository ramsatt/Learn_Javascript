import { Component, OnInit } from '@angular/core';
import { TutorialService, Course } from '../services/tutorial.service';
import { ThemeService } from '../services/theme.service';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AdmobService } from '../services/admob.service';
import { AuthService } from '../services/auth.service';

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
  courses: Course[] = [];
  selectedCourse: Course | null = null;
  coursesView = true; // Default view logic
  
  // Gamification Stats
  xp = 0;
  level = 1;
  currentStreak = 0;
  gems = 0;
  nextLevelXp = 100;
  progressToNextLevel = 0;

  // Mobile sidebar state
  sidebarOpen = false;

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
    private loadingCtrl: LoadingController,
    public authService: AuthService
  ) {}

  async login() {
    const user = await this.authService.loginWithGoogle();
    if (user) {
      console.log('Logged in as', user.displayName);
    }
  }

  async logout() {
    await this.authService.logout();
  }

  ngOnInit() {
      // Initial load
      this.loadCourses();
      // We also load menu data to see if we have a robust default, but we might want to start in "Hub" mode
      // Let's decide: If user has a history, maybe go to valid course? 
      // For now, let's load courses and if we have a 'current' course path in service, we try to match it.
      
      this.tutorialService.getCourses().subscribe(courses => {
          this.courses = courses;
          // Check if service has a non-default path or if we want to restore state
          // For now, let's default to Course View (Hub) to satisfy "adopt multiple tutorials" feel
          this.coursesView = true;
      });
  }

  loadCourses() {
      // already handled in ngOnInit subscription
  }

  selectCourse(course: Course) {
      this.selectedCourse = course;
      this.coursesView = false;
      this.tutorialService.setCourse(course.file);
      this.loadMenuData();
  }

  goBackToCourses() {
      this.coursesView = true;
      this.selectedCourse = null;
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

  async toggleSection(index: number) {
      const section = this.menuData[index];
      if (!section) return;

      if (this.tutorialService.isModuleLocked(index)) {
          await this.promptUnlock(index);
          return;
      }

      section.expanded = !section.expanded;
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

  isNextUp(file: string): boolean {
      if (this.tutorialService.isComplete(file)) return false;
      
      // Check if it is the first incomplete in the ENTIRE list
      for (const section of this.menuData) {
          if (!section.items) continue;
          for (const item of section.items) {
              if (!this.tutorialService.isComplete(item.file)) {
                  return item.file === file;
              }
          }
      }
      return false;
  }

  // Placeholder for retrieving progress for a specific course without loading the full file (requires service update for real data)
  // For now, we return random or mock data to demonstrate the UI
  getCourseProgress(courseId: string): number {
     // Use the same key logic as TutorialService
     // The ID in courses.json matches the file prefix
     const key = `${courseId}_mastery_progress`;
     const saved = localStorage.getItem(key);
     
     if (saved) {
         try {
             const list = JSON.parse(saved);
             if (list.length === 0) return 0;
             
             // We don't have total count easily, so we estimate based on course type
             // or use a smart mapping. For now, let's use a standard block size of 30 
             // (which is what we scrape usually)
             const estimateTotal = 30; 
             return Math.min(Math.round((list.length / estimateTotal) * 100), 100);
         } catch(e) { return 0; }
     }
     
     // Fallback for JS to show some life if it's the first run
     if (courseId === 'javascript') return 42;
     
     return 0; 
  }

  // Mobile sidebar methods
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebarOnMobile() {
    // Only close on mobile screens
    if (window.innerWidth <= 900) {
      this.sidebarOpen = false;
    }
  }
}
