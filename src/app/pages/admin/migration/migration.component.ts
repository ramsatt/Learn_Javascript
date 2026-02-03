import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Firestore, doc, setDoc, writeBatch } from '@angular/fire/firestore';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-migration',
  template: `
    <ion-content class="ion-padding">
      <h1>CMS Migration Tool</h1>
      <p>Click below to move all local assets (JSON/Markdown) to Firebase Firestore.</p>
      
      <ion-button (click)="runMigration()" [disabled]="isMigrating">
        {{ isMigrating ? 'Migrating...' : 'Start Migration' }}
      </ion-button>

      <div class="logs" *ngIf="logs.length > 0">
        <div *ngFor="let log of logs" [class.error]="log.type === 'error'" [class.success]="log.type === 'success'">
          {{ log.message }}
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .logs { background: #1e1e1e; color: #fff; padding: 15px; border-radius: 8px; margin-top: 20px; max-height: 400px; overflow-y: auto; font-family: monospace; }
    .error { color: #ff6b6b; }
    .success { color: #51cf66; }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class MigrationComponent {
  isMigrating = false;
  logs: { type: 'info' | 'success' | 'error', message: string }[] = [];

  constructor(
    private http: HttpClient,
    private firestore: Firestore
  ) {}

  log(message: string, type: 'info' | 'success' | 'error' = 'info') {
    this.logs.unshift({ type, message });
  }

  async runMigration() {
    this.isMigrating = true;
    this.logs = [];
    this.log('Starting migration...');

    try {
      // 1. Migrate Courses
      const courses = await this.http.get<any[]>('assets/courses.json').toPromise() || [];
      this.log(`Found ${courses.length} courses. Migrating...`);

      const batch = writeBatch(this.firestore);

      for (const course of courses) {
        const courseRef = doc(this.firestore, `courses/${course.id}`);
        batch.set(courseRef, course);
        this.log(`Prepared course: ${course.title}`, 'success');

        // 2. Migrate Curriculum for this course
        if (course.file) {
          await this.migrateCurriculumAndContent(course.id, course.file);
        }
      }

      await batch.commit();
      this.log('All courses saved to Firestore.', 'success');

    } catch (error: any) {
      this.log(`Migration Failed: ${error.message}`, 'error');
    } finally {
      this.isMigrating = false;
    }
  }

  async migrateCurriculumAndContent(courseId: string, menuFile: string) {
    try {
      this.log(`Reading curriculum: ${menuFile} for ${courseId}...`);
      const sections = await this.http.get<any[]>(menuFile).toPromise() || [];

      // Save Curriculum
      const curriculumRef = doc(this.firestore, `curriculum/${courseId}`);
      await setDoc(curriculumRef, { sections });
      this.log(`Saved curriculum for ${courseId}`, 'success');

      // 3. Migrate Content (Markdown files)
      for (const section of sections) {
        for (const item of section.items) {
          if (item.file) {
            await this.migrateContentFile(courseId, item.title, item.file);
          }
        }
      }

    } catch (e: any) {
      this.log(`Error reading curriculum ${menuFile}: ${e.message}`, 'error');
    }
  }

  async migrateContentFile(courseId: string, title: string, fileName: string) {
    // Generate a clean slug for the ID (remove extension, sanitize)
    const slug = fileName.replace('.md', '').replace(/[/\\?%*:|"<>]/g, '-');
    
    try {
        const content = await this.http.get(`assets/content/${fileName}`, { responseType: 'text' }).toPromise();
        
        const contentRef = doc(this.firestore, `content/${slug}`);
        await setDoc(contentRef, {
            courseId,
            title,
            originalFile: fileName,
            body: content,
            lastUpdated: new Date()
        });
        this.log(`-> Migrated content: ${title} (${slug})`);
    } catch (e: any) {
        this.log(`Failed to migrate content ${fileName}: ${e.message}`, 'error');
    }
  }
}
