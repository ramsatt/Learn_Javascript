import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class HeaderComponent {
  @Input() title: string = 'Coding Tamilan';
  
  navItems = [
    { label: 'Tutorials', route: '/tutorials' },
    { label: 'Certificates', route: '/certificates' },
    { label: 'Playground', route: '/playground' },
    { label: 'Analysis', route: '/content-analysis' }
  ];

  isSearchOpen = false;
  isDarkMode = false;

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark', this.isDarkMode);
  }

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
  }
}
