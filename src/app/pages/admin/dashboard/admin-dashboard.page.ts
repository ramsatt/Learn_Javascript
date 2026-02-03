
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, AlertController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, collectionData, doc, setDoc, deleteDoc, addDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { MigrationComponent } from '../migration/migration.component';

import { CurriculumEditorComponent } from '../curriculum-editor/curriculum-editor.component';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="dashboard-toolbar">
        <ion-title class="logo-text">CodingTamilan <span class="admin-badge">Admin</span></ion-title>
        <ion-buttons slot="end">
           <ion-button (click)="openMigration()" fill="solid" color="light" class="migration-btn">
             <ion-icon name="cloud-upload-outline" slot="start"></ion-icon>
             Migration Tool
           </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar class="segment-toolbar">
         <ion-segment [(ngModel)]="activeSegment" (ionChange)="activeCourse = null" mode="ios">
            <ion-segment-button value="courses">
                <ion-label>Manage Courses</ion-label>
            </ion-segment-button>
            <ion-segment-button value="content">
                <ion-label>Edit Curriculum</ion-label>
            </ion-segment-button>
         </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="dashboard-bg">
      <div class="main-container">
      
        <!-- COURSES TAB -->
        <div *ngIf="activeSegment === 'courses'" class="fade-in">
           <div class="tab-header">
              <div>
                  <h2>All Courses</h2>
                  <p class="subtitle">Create, update and manage your learning tracks.</p>
              </div>
              <ion-button (click)="editCourse(null)" shape="round" color="primary">
                 <ion-icon name="add" slot="start"></ion-icon>
                 New Course
              </ion-button>
           </div>

           <div class="course-grid">
              <ion-card *ngFor="let course of courses$ | async" class="course-card">
                 <div class="card-icon-wrapper" [style.background]="course.color ? course.color + '20' : '#f4f4f4'">
                    <ion-badge [color]="course.level === 'Beginner' ? 'success' : (course.level === 'Expert' ? 'danger' : 'warning')" mode="ios" class="floating-badge">
                        {{ course.level || 'General' }}
                    </ion-badge>

                    <img *ngIf="course.icon?.includes('/')" [src]="course.icon" />
                    <ion-icon *ngIf="!course.icon?.includes('/')" [name]="course.icon || 'code-slash-outline'" [style.color]="course.color || '#666'"></ion-icon>
                 </div>
                 
                 <ion-card-header>
                    <div class="header-top">
                        <span class="id-text">#{{ course.id }}</span>
                    </div>
                    <ion-card-title>{{ course.title }}</ion-card-title>
                 </ion-card-header>

                 <ion-card-content>
                    <p class="description">{{ course.description || 'No description provided.' }}</p>
                    
                    <div class="stats-row">
                        <span class="stat"><ion-icon name="time-outline"></ion-icon> {{ course.duration || 'N/A' }}</span>
                        <span class="stat"><ion-icon name="book-outline"></ion-icon> {{ course.lessonCount || 0 }} Lessons</span>
                    </div>
                 </ion-card-content>

                 <div class="card-actions">
                    <ion-button fill="clear" size="small" (click)="editCourse(course)">
                        Edit Details
                    </ion-button>
                    <ion-button fill="clear" color="medium" size="small" (click)="deleteCourse(course.id)">
                        <ion-icon name="trash-outline"></ion-icon>
                    </ion-button>
                 </div>
              </ion-card>
           </div>
        </div>

        <!-- CONTENT TAB -->
        <div *ngIf="activeSegment === 'content'" class="fade-in">
           
           <!-- 1. Course Selection Grid -->
           <div *ngIf="!activeCourse">
               <div class="tab-header">
                  <div>
                      <h2>Select Content Source</h2>
                      <p class="subtitle">Choose a course to edit its modules and lessons.</p>
                  </div>
               </div>

               <div class="course-grid">
                  <ion-card *ngFor="let course of courses$ | async" class="course-card selection-card" (click)="selectCourseForEdit(course)">
                     <div class="card-icon-wrapper" [style.background]="course.color ? course.color + '20' : '#f4f4f4'">
                        <img *ngIf="course.icon?.includes('/')" [src]="course.icon" />
                        <ion-icon *ngIf="!course.icon?.includes('/')" [name]="course.icon || 'code-slash-outline'" [style.color]="course.color || '#666'"></ion-icon>
                     </div>
                     <ion-card-header>
                        <ion-card-title>{{ course.title }}</ion-card-title>
                        <ion-card-subtitle>Edit Curriculum & Content</ion-card-subtitle>
                     </ion-card-header>
                  </ion-card>
               </div>
           </div>

           <!-- 2. Editor View -->
           <div *ngIf="activeCourse" class="editor-view">
               <div class="editor-toolbar">
                   <ion-button fill="clear" color="dark" (click)="activeCourse = null">
                      <ion-icon name="arrow-back" slot="start"></ion-icon>
                      Back
                   </ion-button>
                   <h3>Editing: {{ activeCourse.title }}</h3>
               </div>
               
               <app-curriculum-editor [courseId]="activeCourse.id"></app-curriculum-editor>
           </div>
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    /* Global & Layout */
    .dashboard-bg { --background: #f8f9fa; }
    .main-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    
    /* Header */
    .dashboard-toolbar { --background: #1a1a1a; --color: white; padding: 0 10px; }
    .logo-text { font-weight: 700; font-size: 1.2rem; letter-spacing: 0.5px; }
    .admin-badge { background: #333; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; vertical-align: middle; margin-left: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .migration-btn { text-transform: none; font-weight: 500; --border-radius: 8px; font-size: 0.9rem; }
    
    .segment-toolbar { --background: #fff; border-bottom: 1px solid #eee; }
    ion-segment { max-width: 400px; margin: 0 auto; }

    /* Tab Header */
    .tab-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; padding: 0 5px; }
    .tab-header h2 { margin: 0; font-size: 1.8rem; font-weight: 700; color: #111; }
    .tab-header .subtitle { margin: 5px 0 0; color: #666; font-size: 0.95rem; }

    /* Grid Layout */
    .course-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
    
    /* Card Styles */
    .course-card { 
        margin: 0; 
        border-radius: 16px; 
        box-shadow: 0 10px 30px rgba(0,0,0,0.06); 
        background: #fff; 
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(0,0,0,0.03);
    }
    .course-card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
    
    .card-icon-wrapper { 
        height: 140px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        position: relative;
    }
    .card-icon-wrapper ion-icon { font-size: 64px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
    .card-icon-wrapper img { width: 64px; height: 64px; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }

    .floating-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 5px 12px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.75rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 10;
        letter-spacing: 0.5px;
    }

    ion-card-header { padding: 16px 16px 8px 16px; }
    .header-top { display: flex; justify-content: flex-end; margin-bottom: 4px; }
    .id-text { font-size: 0.7rem; color: #aaa; font-family: monospace; background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
    
    ion-card-title { font-size: 1.25rem; font-weight: 700; color: #222; margin-top: 5px; }
    
    ion-card-content { flex: 1; padding: 0 16px 16px 16px; display: flex; flex-direction: column; }
    .description { 
        color: #666; 
        font-size: 0.9rem; 
        line-height: 1.5; 
        display: -webkit-box; 
        -webkit-line-clamp: 2; 
        -webkit-box-orient: vertical; 
        overflow: hidden;
        margin-bottom: 15px; 
        flex: 1;
        margin-top: 8px;
    }
    
    .stats-row { display: flex; gap: 15px; border-top: 1px solid #f0f0f0; padding-top: 12px; margin-top: auto; }
    .stat { font-size: 0.8rem; color: #777; display: flex; align-items: center; gap: 6px; font-weight: 500; }
    .stat ion-icon { font-size: 1rem; color: #999; }

    .card-actions { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid #f0f0f0; background: #fafafa; }
    
    /* Selection Card specific */
    .selection-card { cursor: pointer; }
    .selection-card:active { transform: scale(0.98); }

    /* Editor View */
    .editor-view { background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); padding: 20px; min-height: 80vh; }
    .editor-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    .editor-toolbar h3 { margin: 0; font-weight: 600; }

    /* Animation */
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* Dark Mode Support (optional, basic overrides) */
    @media (prefers-color-scheme: dark) {
        .dashboard-bg { --background: #121212; }
        .course-card, .editor-view { background: #1e1e1e; color: #fff; border: 1px solid #333; }
        .segment-toolbar { --background: #1e1e1e; border-bottom-color: #333; }
        ion-card-title { color: #fff; }
        .description { color: #aaa; }
        .card-actions { background: #252525; border-top-color: #333; }
        .tab-header h2 { color: #fff; }
        .editor-toolbar h3 { color: #fff; }
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, CurriculumEditorComponent]
})
export class AdminDashboardPage implements OnInit {
  activeSegment = 'courses';
  courses$: Observable<any[]>;
  activeCourse: any = null;

  constructor(
    private firestore: Firestore,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    const coursesRef = collection(this.firestore, 'courses');
    this.courses$ = collectionData(coursesRef, { idField: 'id' });
  }

  ngOnInit() {}

  selectCourseForEdit(course: any) {
      this.activeCourse = course;
  }

  async openMigration() {
    const modal = await this.modalCtrl.create({
      component: MigrationComponent
    });
    await modal.present();
  }

  async editCourse(course: any) {
    const isNew = !course;
    const alert = await this.alertCtrl.create({
      header: isNew ? 'Add Course' : 'Edit Course',
      inputs: [
        { name: 'id', type: 'text', placeholder: 'ID (e.g. javascript)', value: course?.id, disabled: !isNew }, // ID cannot change
        { name: 'title', type: 'text', placeholder: 'Title', value: course?.title },
        { name: 'icon', type: 'text', placeholder: 'Icon URL', value: course?.icon },
        { name: 'description', type: 'textarea', placeholder: 'Description', value: course?.description },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: async (data) => {
             if (!data.id || !data.title) return false;
             
             const docRef = doc(this.firestore, `courses/${data.id}`);
             await setDoc(docRef, {
                 title: data.title,
                 icon: data.icon,
                 description: data.description,
                 isActive: true
                 // Preserve other fields if needed or merge
             }, { merge: true });
             
             this.showToast(isNew ? 'Course Created' : 'Course Updated');
             return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteCourse(id: string) {
      const alert = await this.alertCtrl.create({
          header: 'Confirm Delete',
          message: `Are you sure you want to delete ${id}? This cannot be undone.`,
          buttons: [
              { text: 'Cancel', role: 'cancel' },
              { 
                  text: 'Delete', 
                  role: 'destructive',
                  handler: async () => {
                      await deleteDoc(doc(this.firestore, `courses/${id}`));
                      this.showToast('Course deleted');
                  }
              }
          ]
      });
      await alert.present();
  }

  private async showToast(msg: string) {
      const toast = await this.toastCtrl.create({ message: msg, duration: 2000 });
      toast.present();
  }
}
