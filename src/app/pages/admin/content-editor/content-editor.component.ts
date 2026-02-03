
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
import { take } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-content-editor',
  template: `
    <ion-header>
      <ion-toolbar color="tertiary">
        <ion-buttons slot="start">
          <ion-button (click)="close()">Cancel</ion-button>
        </ion-buttons>
        <ion-title>Edit Content: {{ slug }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="save()" [disabled]="saving">
            <ion-icon name="save-outline" slot="start"></ion-icon>
            Save
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
         <ion-segment [(ngModel)]="mode">
            <ion-segment-button value="edit">Edit Code</ion-segment-button>
            <ion-segment-button value="preview">Preview</ion-segment-button>
         </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      
      <div *ngIf="loading" class="ion-text-center ion-padding-top">
         <ion-spinner></ion-spinner>
      </div>

      <!-- EDIT MODE -->
      <div *ngIf="!loading && mode === 'edit'" class="editor-container">
         <ion-item>
            <ion-label position="stacked">Title</ion-label>
            <ion-input [(ngModel)]="title" placeholder="Lesson Title"></ion-input>
         </ion-item>
         
         <div class="code-editor-wrapper">
             <textarea 
                [(ngModel)]="content" 
                class="code-editor" 
                placeholder="Write your HTML or Markdown content here..."
                spellcheck="false">
             </textarea>
         </div>
      </div>

      <!-- PREVIEW MODE -->
      <div *ngIf="!loading && mode === 'preview'" class="preview-container">
         <h2>{{ title }}</h2>
         <!-- Be careful with styles being isolated or not -->
         <div class="content-preview" [innerHTML]="sanitizedContent"></div>
      </div>

    </ion-content>
  `,
  styles: [`
    .editor-container, .preview-container { height: 100%; display: flex; flex-direction: column; }
    .code-editor-wrapper { flex: 1; border: 1px solid #444; border-radius: 4px; display: flex; flex-direction: column; margin-top: 10px; }
    .code-editor { 
        flex: 1; 
        background: #1e1e1e; 
        color: #d4d4d4; 
        font-family: 'Consolas', 'Monaco', monospace; 
        padding: 15px; 
        border: none; 
        resize: none; 
        font-size: 14px; 
        line-height: 1.5;
        outline: none;
        min-height: 400px; 
    }
    .content-preview { background: #fff; color: #333; padding: 20px; border-radius: 4px; overflow-y: auto; }
    /* Simple emulation of tutorial styles */
    ::ng-deep .content-preview h1 { font-size: 24px; margin-bottom: 0.5em; }
    ::ng-deep .content-preview pre { background: #f4f4f4; padding: 10px; border-left: 3px solid #04AA6D; overflow-x: auto; }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class ContentEditorComponent implements OnInit {
  @Input() slug: string = '';
  @Input() courseId: string = '';
  
  // Data
  title = '';
  content = '';
  
  mode = 'edit';
  loading = true;
  saving = false;

  constructor(
    private modalCtrl: ModalController,
    private firestore: Firestore,
    private toastCtrl: ToastController,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
     if (this.slug) {
         this.loadContent();
     }
  }

  async loadContent() {
      this.loading = true;
      const docRef = doc(this.firestore, `content/${this.slug}`);
      docData(docRef).pipe(take(1)).subscribe((data: any) => {
          this.loading = false;
          if (data) {
              this.title = data.title || '';
              this.content = data.body || '';
          } else {
              // New content or not found
              this.content = '<h1>New Lesson</h1>\n<p>Start writing...</p>';
          }
      });
  }

  get sanitizedContent(): SafeHtml {
      return this.sanitizer.bypassSecurityTrustHtml(this.content);
  }

  async save() {
      this.saving = true;
      try {
          const docRef = doc(this.firestore, `content/${this.slug}`);
          await setDoc(docRef, {
              title: this.title,
              body: this.content,
              courseId: this.courseId,
              lastUpdated: new Date()
          }, { merge: true });
          
          this.showToast('Content Saved', 'success');
          this.close(true);
      } catch (e: any) {
          this.showToast('Error: ' + e.message, 'danger');
      } finally {
          this.saving = false;
      }
  }

  close(changed = false) {
      this.modalCtrl.dismiss(changed);
  }

  private async showToast(message: string, color: string) {
      const toast = await this.toastCtrl.create({ message, duration: 2000, color });
      toast.present();
  }
}
