import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tutorial-card',
  templateUrl: './tutorial-card.component.html',
  styleUrls: ['./tutorial-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class TutorialCardComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() icon: string = 'logo-html5';
  @Input() color: string = 'html'; // maps to --ct-<color>
  @Input() level: string = 'Beginner';
  @Input() route: string = '/';
  @Input() duration: string = '2h 30m';
  @Input() lessonCount: number = 20;
  
  @Output() start = new EventEmitter<void>();

  onStart() {
    this.start.emit();
  }
}
