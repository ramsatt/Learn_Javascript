import { Injectable } from '@angular/core';
import { AdMob, BannerAdOptions, BannerAdPosition, BannerAdSize, AdOptions, RewardAdOptions } from '@capacitor-community/admob';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AdmobService {
  
  // Ad IDs
  private readonly bannerId = 'ca-app-pub-8970665297590705/6508871823';
  private readonly interstitialId = 'ca-app-pub-8970665297590705/7929764709';
  private readonly rewardId = 'ca-app-pub-8970665297590705/7390515130';

  constructor(private platform: Platform) {
    this.initialize();
  }

  async initialize() {
    await this.platform.ready();
    try {
      await AdMob.initialize({
        initializeForTesting: false
      });
    } catch (e) {
      // Handle error silent or log to analytics
    }
  }

  async showBanner() {
    if (this.platform.is('capacitor')) {
        const options: BannerAdOptions = {
            adId: this.bannerId,
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            margin: 0,
            isTesting: false
        };
        try {
            await AdMob.showBanner(options);
        } catch(e) {
        }
    }
  }

  async hideBanner() {
      try {
          await AdMob.hideBanner();
      } catch(e) {}
  }

  async showInterstitial() {
      if (!this.platform.is('capacitor')) return;
      
      const options: AdOptions = {
          adId: this.interstitialId,
          isTesting: false
      };
      
      try {
          await AdMob.prepareInterstitial(options);
          await AdMob.showInterstitial();
      } catch(e) {
      }
  }

  async showReward() {
      if (!this.platform.is('capacitor')) return;
      
      const options: RewardAdOptions = {
          adId: this.rewardId,
          isTesting: false
      };

      try {
          await AdMob.prepareRewardVideoAd(options);
          await AdMob.showRewardVideoAd();
      } catch(e) {
      }
  }
}
