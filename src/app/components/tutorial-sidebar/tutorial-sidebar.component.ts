import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-tutorial-sidebar',
  templateUrl: './tutorial-sidebar.component.html',
  styleUrls: ['./tutorial-sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class TutorialSidebarComponent {
  @Input() menuData: any[] = [];
  @Input() currentFile: string = '';
  @Output() selectFile = new EventEmitter<string>();
  
  toggleSection(section: any) {
    if (section && section.expanded !== undefined) {
      section.expanded = !section.expanded;
    }
  }
  
  onSelect(file: string) {
    if (file) {
      this.selectFile.emit(file);
    }
  }
  
  isActive(file: string): boolean {
    return this.currentFile === file;
  }
}
