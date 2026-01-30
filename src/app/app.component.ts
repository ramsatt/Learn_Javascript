import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { AdmobService } from './services/admob.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

declare const gtag: Function;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
      private platform: Platform,
      private admobService: AdmobService,
      private router: Router
  ) {
    this.initializeApp();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      gtag('config', 'G-HZQQ8H2M7F', {
        'page_path': event.urlAfterRedirects
      });
    });
  }

  async initializeApp() {
    await this.platform.ready();
    // AdMob initialized - banner will be shown on content pages only
  }
}
