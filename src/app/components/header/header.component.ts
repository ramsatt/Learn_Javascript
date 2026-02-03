import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class HeaderComponent implements OnInit {
  @Input() title: string = 'Coding Tamilan';
  
  navItems: any[] = [
    { label: 'Tutorials', route: '/tutorials' },
    { label: 'Certificates', route: '/certificates' },
    { label: 'Playground', route: '/playground' }
  ];
  
  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.updateNavItems(user);
    });
  }

  updateNavItems(user: any) {
    this.navItems = [
      { label: 'Tutorials', route: '/tutorials' },
      { label: 'Certificates', route: '/certificates' },
      { label: 'Playground', route: '/playground' }
    ];

    if (user && user.email === 'ramsatt@gmail.com') {
      this.navItems.push({ label: 'Analysis', route: '/content-analysis' });
    }
  }

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
