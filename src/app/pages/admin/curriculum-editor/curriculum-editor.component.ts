
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, setDoc, docData } from '@angular/fire/firestore';
import { take } from 'rxjs/operators';
import { TutorialItem, TutorialSection } from '../../../services/tutorial.service';
import { ContentEditorComponent } from '../content-editor/content-editor.component';

@Component({
  selector: 'app-curriculum-editor',
  template: `
    <div *ngIf="loading" class="ion-text-center ion-padding">
      <ion-spinner></ion-spinner>
      <p>Loading Curriculum...</p>
    </div>

    <div *ngIf="!loading">
       <div class="editor-header ion-margin-bottom">
          <h3>Editing: {{ courseId | titlecase }}</h3>
          <ion-button color="success" (click)="save()">
            <ion-icon name="save-outline" slot="start"></ion-icon>
            Save Changes
          </ion-button>
       </div>

       <ion-list>
          <!-- Sections -->
          <ion-item-group *ngFor="let section of sections; let i = index" class="section-group">
             <ion-item-divider sticky>
                <ion-reorder slot="start"></ion-reorder> <!-- Visual only if we had dragdrop, using buttons instead -->
                <div class="order-buttons">
                    <ion-button fill="clear" size="small" (click)="moveSection(i, -1)" [disabled]="i === 0">
                        <ion-icon name="arrow-up-outline"></ion-icon>
                    </ion-button>
                     <ion-button fill="clear" size="small" (click)="moveSection(i, 1)" [disabled]="i === sections.length - 1">
                        <ion-icon name="arrow-down-outline"></ion-icon>
                    </ion-button>
                </div>

                <ion-label class="ion-text-wrap">
                   <h2>
                     {{ section.title }}
                     <ion-button fill="clear" size="small" (click)="editSection(i)">
                       <ion-icon name="pencil-outline"></ion-icon>
                     </ion-button>
                   </h2>
                </ion-label>
                
                <ion-buttons slot="end">
                   <ion-button color="danger" (click)="deleteSection(i)">
                      <ion-icon name="trash-outline"></ion-icon>
                   </ion-button>
                   <ion-button (click)="toggleSection(i)">
                      <ion-icon [name]="section.expanded ? 'chevron-up-outline' : 'chevron-down-outline'"></ion-icon>
                   </ion-button>
                </ion-buttons>
             </ion-item-divider>

             <!-- Items in Section -->
             <div *ngIf="section.expanded">
                <ion-item *ngFor="let item of section.items; let j = index">
                   <div class="order-buttons" slot="start">
                      <ion-button fill="clear" size="small" (click)="moveItem(i, j, -1)" [disabled]="j === 0">
                          <ion-icon name="arrow-up-outline"></ion-icon>
                      </ion-button>
                      <ion-button fill="clear" size="small" (click)="moveItem(i, j, 1)" [disabled]="j === section.items.length - 1">
                          <ion-icon name="arrow-down-outline"></ion-icon>
                      </ion-button>
                  </div>
                   <ion-label>
                      <h3>{{ item.title }}</h3>
                      <p class="file-text">{{ item.file }}</p>
                   </ion-label>
                   <ion-buttons slot="end">
                      <ion-button color="tertiary" (click)="openContentEditor(item)">
                         <ion-icon name="document-text-outline"></ion-icon>
                      </ion-button>
                      <ion-button (click)="editItem(i, j)">
                         <ion-icon name="create-outline"></ion-icon>
                      </ion-button>
                      <ion-button color="danger" (click)="deleteItem(i, j)">
                         <ion-icon name="close-circle-outline"></ion-icon>
                      </ion-button>
                   </ion-buttons>
                </ion-item>
                
                <ion-item lines="none">
                   <ion-button fill="outline" size="small" expand="block" (click)="addItem(i)" class="add-btn">
                      + Add Lesson
                   </ion-button>
                </ion-item>
             </div>
          </ion-item-group>
       </ion-list>

       <ion-button expand="block" fill="dashed" class="ion-margin-top" (click)="addSection()">
          + Add New Section
       </ion-button>
    </div>
  `,
  styles: [`
    .section-group { border: 1px solid #333; margin-bottom: 10px; border-radius: 8px; overflow: hidden; }
    ion-item-divider { --background: #222; }
    .order-buttons { display: flex; flex-direction: column; }
    .order-buttons ion-button { height: 1.5em; margin: 0; }
    .file-text { font-size: 0.8em; opacity: 0.7; }
    .add-btn { width: 100%; margin: 10px 0; border-style: dashed; }
    .editor-header { display: flex; justify-content: space-between; align-items: center; }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class CurriculumEditorComponent implements OnInit, OnChanges {
  @Input() courseId: string = '';
  
  sections: TutorialSection[] = [];
  loading = false;

  constructor(
    private firestore: Firestore,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
     if (changes['courseId'] && this.courseId) {
         this.loadCurriculum();
     }
  }

  async openContentEditor(item: any) {
     if (!item.file) return; 
     
     // Ensure we use the clean slug logic used everywhere
     const slug = item.file.replace('.md', '').replace(/[\/\\?%*:|"<>]/g, '-');

     const modal = await this.modalCtrl.create({
         component: ContentEditorComponent,
         componentProps: {
             slug: slug,
             courseId: this.courseId
         }
     });
     
     await modal.present();
     
     // Could reload if we wanted updates but content is separate from curriculum structure
  }

  async loadCurriculum() {
      this.loading = true;
      const ref = doc(this.firestore, `curriculum/${this.courseId}`);
      docData(ref).pipe(take(1)).subscribe((data: any) => {
          this.loading = false;
          if (data && data.sections) {
              this.sections = data.sections.map((s: any) => ({...s, expanded: true})); // Default expand for editing
          } else {
              this.sections = [];
          }
      });
  }

  async save() {
      if (!this.courseId) return;
      try {
          // Clean up UI properties like 'expanded' before saving if strictly needed, 
          // but Firestore is schemaless so it's fine. Cleaner to keep it pure though.
          const cleanSections = this.sections.map(s => ({
              title: s.title,
              items: s.items
          }));

          const ref = doc(this.firestore, `curriculum/${this.courseId}`);
          await setDoc(ref, { sections: cleanSections }, { merge: true });
          this.showToast('Curriculum Saved!', 'success');
      } catch (e: any) {
          this.showToast('Save Failed: ' + e.message, 'danger');
      }
  }

  // --- Actions ---

  toggleSection(index: number) {
      this.sections[index].expanded = !this.sections[index].expanded;
  }

  moveSection(index: number, direction: number) {
      const newIndex = index + direction;
      if (newIndex >= 0 && newIndex < this.sections.length) {
          const temp = this.sections[index];
          this.sections[index] = this.sections[newIndex];
          this.sections[newIndex] = temp;
      }
  }

  moveItem(sectionIndex: number, itemIndex: number, direction: number) {
       const section = this.sections[sectionIndex];
       const newIndex = itemIndex + direction;
       if (newIndex >= 0 && newIndex < section.items.length) {
           const temp = section.items[itemIndex];
           section.items[itemIndex] = section.items[newIndex];
           section.items[newIndex] = temp;
       }
  }

  async addSection() {
      const alert = await this.alertCtrl.create({
          header: 'New Section',
          inputs: [{ name: 'title', placeholder: 'Section Title' }],
          buttons: [
              { text: 'Cancel', role: 'cancel' },
              {
                  text: 'Add',
                  handler: (data) => {
                      if (data.title) {
                          this.sections.push({ title: data.title, items: [], expanded: true });
                      }
                  }
              }
          ]
      });
      await alert.present();
  }

  async editSection(index: number) {
      const alert = await this.alertCtrl.create({
          header: 'Rename Section',
          inputs: [{ name: 'title', value: this.sections[index].title, placeholder: 'Section Title' }],
          buttons: [
              { text: 'Cancel', role: 'cancel' },
              {
                  text: 'Update',
                  handler: (data) => {
                      if (data.title) {
                          this.sections[index].title = data.title;
                      }
                  }
              }
          ]
      });
      await alert.present();
  }

  async deleteSection(index: number) {
      const alert = await this.alertCtrl.create({
          header: 'Delete Section?',
          message: 'This will delete all items in this section.',
          buttons: [
              { text: 'Cancel', role: 'cancel' },
              { 
                  text: 'Delete', 
                  role: 'destructive',
                  handler: () => {
                      this.sections.splice(index, 1);
                  }
              }
          ]
      });
      await alert.present();
  }

  async addItem(sectionIndex: number) {
       const alert = await this.alertCtrl.create({
          header: 'New Lesson',
          inputs: [
              { name: 'title', placeholder: 'Lesson Title' },
              { name: 'file', placeholder: 'File Slug (e.g. js-intro)' },
          ],
          buttons: [
              { text: 'Cancel', role: 'cancel' },
              {
                  text: 'Add',
                  handler: (data) => {
                      if (data.title && data.file) {
                          // Auto append .html if missed? Or assume slug?
                          // Our service expects distinct file names often ending in .html currently for migration compat
                          // But new system is slug based. TutorialService maps legacy .html to slug.
                          // Let's stick to the current convention: slug or filename. 
                          // Ideally we move to pure slugs. 
                          // For now, let user input whatever matches their content ID.
                          this.sections[sectionIndex].items.push({
                              title: data.title,
                              file: data.file
                          });
                      }
                  }
              }
          ]
      });
      await alert.present();
  }

  async editItem(sectionIndex: number, itemIndex: number) {
      const item = this.sections[sectionIndex].items[itemIndex];
      const alert = await this.alertCtrl.create({
          header: 'Edit Lesson',
          inputs: [
              { name: 'title', value: item.title, placeholder: 'Lesson Title' },
              { name: 'file', value: item.file, placeholder: 'File/Slug' },
          ],
          buttons: [
              { text: 'Cancel', role: 'cancel' },
              {
                  text: 'Update',
                  handler: (data) => {
                      if (data.title && data.file) {
                          const updated = this.sections[sectionIndex].items[itemIndex];
                          updated.title = data.title;
                          updated.file = data.file;
                      }
                  }
              }
          ]
      });
      await alert.present();
  }

  async deleteItem(sectionIndex: number, itemIndex: number) {
      this.sections[sectionIndex].items.splice(itemIndex, 1);
  }

  private async showToast(message: string, color: string = 'dark') {
      const toast = await this.toastCtrl.create({ message, duration: 2000, color });
      toast.present();
  }
}
