
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { User } from '@angular/fire/auth';

export interface TutorialItem {
  title: string;
  file: string;
}

export interface TutorialSection {
  title: string;
  items: TutorialItem[];
  progress?: number; // Add progress to section interface
}

export interface Course {
  id: string;
  title: string;
  icon: string;
  color: string;
  file: string;
  description: string;
  level?: string;
  duration?: string;
  lessonCount?: number;
  route?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  private coursesPath = 'assets/courses.json';
  private menuPath = 'assets/data/javascript.json'; // Default
  private currentCoursePathKey = 'current_course_path';
  private contentPath = 'assets/content/';
  private completedKey = 'js_mastery_progress';
  private gamificationKey = 'js_mastery_gamification';
  private completedTutorials: Set<string> = new Set();
  
  // Gamification State
  xp = 0;
  level = 1;
  currentStreak = 0;
  lastLoginDate: string | null = null;
  gems = 0;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private firestore: Firestore
  ) {
      this.loadCurrentCourse();
      this.checkStreak();
      
      // Reactive progress loading when user changes
      this.authService.user$.subscribe(async (user: User | null) => {
          await this.loadProgress(); // Wait for cloud data if available
          if (user) {
              // Only sync if we have something or want to ensure cloud has latest
              await this.syncLocalToFirebase(user.uid);
          }
      });
  }

  private loadCurrentCourse() {
      const saved = localStorage.getItem(this.currentCoursePathKey);
      if (saved) {
          this.menuPath = saved;
          const courseId = saved.split('/').pop()?.replace('.json', '') || 'default';
          this.completedKey = `${courseId}_mastery_progress`;
      }
  }

  setCourse(path: string) {
      this.menuPath = path;
      localStorage.setItem(this.currentCoursePathKey, path);
      
      const courseId = path.split('/').pop()?.replace('.json', '') || 'default';
      this.completedKey = `${courseId}_mastery_progress`;
      
      this.loadProgress();
      this.initLocks();
  }


  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(this.coursesPath);
  }

  getMenu(path?: string): Observable<TutorialSection[]> {
    return this.http.get<TutorialSection[]>(path || this.menuPath);
  }


  getContent(fileName: string): Observable<string> {
    return this.http.get(this.contentPath + fileName, { responseType: 'text' });
  }
  
  // Progress Logic
  async loadProgress() {
      const user = this.authService.getCurrentUser();
      
      // Always load Local Storage first as a base
      const saved = localStorage.getItem(this.completedKey);
      if (saved) {
          try {
              const list = JSON.parse(saved);
              this.completedTutorials = new Set(list);
          } catch(e) { console.error('Error loading local progress', e); }
      }

      const savedGame = localStorage.getItem(this.gamificationKey);
      if (savedGame) {
          try {
              const gameData = JSON.parse(savedGame);
              this.xp = gameData.xp || 0;
              this.level = gameData.level || 1;
              this.currentStreak = gameData.currentStreak || 0;
              this.lastLoginDate = gameData.lastLoginDate || null;
              this.gems = gameData.gems || 0;
          } catch(e) { console.error('Error loading local gamification', e); }
      }

      if (user) {
          // Merge with Firebase if logged in
          const userDoc = doc(this.firestore, `users/${user.uid}`);
          const docSnap = await getDoc(userDoc);
          
          if (docSnap.exists()) {
              const data = docSnap.data();
              const cloudProgress = data['progress'] || {};
              const cloudList = cloudProgress[this.completedKey] || [];
              
              // Merge Logic: Combine sets to ensure no progress is lost
              cloudList.forEach((file: string) => this.completedTutorials.add(file));
              
              const cloudGame = data['gamification'] || {};
              // Take the higher values (simple merge)
              this.xp = Math.max(this.xp, cloudGame.xp || 0);
              this.level = Math.max(this.level, cloudGame.level || 1);
              this.gems = Math.max(this.gems, cloudGame.gems || 0);
              this.currentStreak = Math.max(this.currentStreak, cloudGame.currentStreak || 0);
              
              // Save the merged result back to local
              localStorage.setItem(this.completedKey, JSON.stringify(Array.from(this.completedTutorials)));
              localStorage.setItem(this.gamificationKey, JSON.stringify({
                  xp: this.xp,
                  level: this.level,
                  currentStreak: this.currentStreak,
                  lastLoginDate: this.lastLoginDate,
                  gems: this.gems
              }));
          }
      }
  }

  markComplete(fileName: string): boolean {
      if (!this.completedTutorials.has(fileName)) {
          this.completedTutorials.add(fileName);
          this.saveProgress();
          this.awardXP(50);
          return true;
      }
      return false;
  }

  isComplete(fileName: string): boolean {
      return this.completedTutorials.has(fileName);
  }

  getProgress(items: TutorialItem[]): number {
      if (!items || items.length === 0) return 0;
      const completedCount = items.filter(i => this.completedTutorials.has(i.file)).length;
      return Math.round((completedCount / items.length) * 100);
  }

  private async saveProgress() {
      const gameData = {
          xp: this.xp,
          level: this.level,
          currentStreak: this.currentStreak,
          lastLoginDate: this.lastLoginDate,
          gems: this.gems
      };

      localStorage.setItem(this.completedKey, JSON.stringify(Array.from(this.completedTutorials)));
      localStorage.setItem(this.gamificationKey, JSON.stringify(gameData));

      const user = this.authService.getCurrentUser();
      if (user) {
          const userDoc = doc(this.firestore, `users/${user.uid}`);
          await setDoc(userDoc, {
              progress: {
                  [this.completedKey]: Array.from(this.completedTutorials)
              },
              gamification: gameData,
              updatedAt: new Date()
          }, { merge: true });
      }
  }

  private async syncLocalToFirebase(uid: string) {
      const userDoc = doc(this.firestore, `users/${uid}`);
      const gameData = {
          xp: this.xp,
          level: this.level,
          currentStreak: this.currentStreak,
          lastLoginDate: this.lastLoginDate,
          gems: this.gems
      };

      await setDoc(userDoc, {
          progress: {
              [this.completedKey]: Array.from(this.completedTutorials)
          },
          gamification: gameData,
          lastSyncAt: new Date()
      }, { merge: true });
  }

  // Gamification Methods
  awardXP(amount: number) {
      this.xp += amount;
      this.checkLevelUp();
      this.saveProgress();
  }

  private checkLevelUp() {
      const nextLevelXp = this.level * 100 * 1.5; // Simple curve
      if (this.xp >= nextLevelXp) {
          this.level++;
          this.gems += 5; // Level up reward
          // Recursive check in case multiple levels gained
          this.checkLevelUp();
      }
  }

  checkStreak() {
      const today = new Date().toDateString();
      if (this.lastLoginDate === today) return; // Already logged in today

      if (this.lastLoginDate) {
          const last = new Date(this.lastLoginDate);
          const diff = new Date().getTime() - last.getTime();
          const diffDays = Math.floor(diff / (1000 * 3600 * 24));

          if (diffDays === 1) {
              this.currentStreak++;
          } else if (diffDays > 1) {
              this.currentStreak = 1; // Reset
          }
      } else {
          this.currentStreak = 1; // First login
      }
      
      this.lastLoginDate = today;
      this.saveProgress();
  }

  getPendingXP(): number {
      const nextLevelXp = this.level * 100 * 1.5;
      return nextLevelXp - this.xp;
  }
  
  getNextLevelXP(): number {
       return this.level * 100 * 1.5;
  }
  // --- Module Locking Logic ---
  
  // Initialize with persisted unlocked modules
  private unlockedModules: Set<string> = new Set<string>();

  initLocks() {
      this.unlockedModules = new Set<string>();
      const key = 'unlocked_modules_' + (this.menuPath || 'default');
      const saved = localStorage.getItem(key);
      
      if (saved) {
          this.unlockedModules = new Set(JSON.parse(saved));
      } else {
          // Backward compatibility for JS
          if (this.menuPath && this.menuPath.includes('javascript')) {
             const oldSaved = localStorage.getItem('unlocked_modules');
             if (oldSaved) this.unlockedModules = new Set(JSON.parse(oldSaved));
          }
      }
  }

  isModuleLocked(index: number): boolean {
      // First 5 modules (0-4) are always free
      if (index < 5) return false;
      
      // Check if unlocked (we use index as key for simplicity, or title)
      if (this.unlockedModules.has(index.toString())) return false;
      
      return true;
  }

  unlockNextSet(currentIndex: number) {
      // Logic: Unlock the current block of 5.
      // E.g. if index is 5, unlock 5,6,7,8,9
      const start = Math.floor(currentIndex / 5) * 5;
      for (let i = start; i < start + 5; i++) {
          this.unlockedModules.add(i.toString());
      }
      this.saveLocks();
  }

  private saveLocks() {
      const key = 'unlocked_modules_' + (this.menuPath || 'default');
      localStorage.setItem(key, JSON.stringify(Array.from(this.unlockedModules)));
  }

  // --- Playground State ---
  private playgroundCode: string = '';

  setPlaygroundCode(code: string) {
      this.playgroundCode = code;
  }

  getPlaygroundCode(): string {
      const code = this.playgroundCode;
      this.playgroundCode = ''; // Clear after retrieval
      return code;
  }
}
