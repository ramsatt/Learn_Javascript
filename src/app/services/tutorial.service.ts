
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
  private completedTutorials: Set<string> = new Set();

  constructor(private http: HttpClient) {
      this.loadProgress();
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
  }

  markComplete(fileName: string) {
      if (!this.completedTutorials.has(fileName)) {
          this.completedTutorials.add(fileName);
          this.saveProgress();
      }
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
  }
}
