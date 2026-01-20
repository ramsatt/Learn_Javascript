import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { AdmobService } from './services/admob.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
      private platform: Platform,
      private admobService: AdmobService
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();
    // Initialize Ads and Show Banner
    this.admobService.showBanner();
  }
}
