
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TutorialItem {
  title: string;
  file: string;
}

export interface TutorialSection {
  title: string;
  items: TutorialItem[];
}

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  private menuPath = 'assets/menu_data.json';
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

  constructor(private http: HttpClient) {
      this.loadProgress();
      this.checkStreak();
  }

  getMenu(): Observable<TutorialSection[]> {
    return this.http.get<TutorialSection[]>(this.menuPath);
  }

  getContent(fileName: string): Observable<string> {
    return this.http.get(this.contentPath + fileName, { responseType: 'text' });
  }
  
  // Progress Logic
  private loadProgress() {
      const saved = localStorage.getItem(this.completedKey);
      if (saved) {
          try {
              const list = JSON.parse(saved);
              this.completedTutorials = new Set(list);
          } catch(e) { console.error('Error loading progress', e); }
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
          } catch(e) { console.error('Error loading gamification', e); }
      }
  }

  markComplete(fileName: string): boolean {
      if (!this.completedTutorials.has(fileName)) {
          this.completedTutorials.add(fileName);
          this.saveProgress();
          
          // Award XP for new completion
          this.awardXP(50);
          return true; // First time complete
      }
      return false; // Already complete
  }

  isComplete(fileName: string): boolean {
      return this.completedTutorials.has(fileName);
  }

  getProgress(items: TutorialItem[]): number {
      if (!items || items.length === 0) return 0;
      const completedCount = items.filter(i => this.completedTutorials.has(i.file)).length;
      return Math.round((completedCount / items.length) * 100);
  }

  private saveProgress() {
      localStorage.setItem(this.completedKey, JSON.stringify(Array.from(this.completedTutorials)));
      
      const gameData = {
          xp: this.xp,
          level: this.level,
          currentStreak: this.currentStreak,
          lastLoginDate: this.lastLoginDate,
          gems: this.gems
      };
      localStorage.setItem(this.gamificationKey, JSON.stringify(gameData));
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
}
