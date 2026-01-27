import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private isDark = false;
  private readonly THEME_KEY = 'selected-app-theme';

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.initTheme();
  }

  private initTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    
    if (savedTheme) {
        this.setTheme(savedTheme === 'dark');
    } else {
        // Fallback to system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        this.setTheme(prefersDark.matches);
        
        // Listen for system changes
        prefersDark.addEventListener('change', (mediaQuery) => {
            if (!localStorage.getItem(this.THEME_KEY)) {
                this.setTheme(mediaQuery.matches);
            }
        });
    }
  }

  toggleTheme() {
    this.setTheme(!this.isDark);
  }

  private setTheme(dark: boolean) {
    this.isDark = dark;
    
    if (dark) {
      this.renderer.addClass(document.body, 'dark');
      localStorage.setItem(this.THEME_KEY, 'dark');
    } else {
      this.renderer.removeClass(document.body, 'dark');
      localStorage.setItem(this.THEME_KEY, 'light');
    }
  }

  isDarkMode(): boolean {
      return this.isDark;
  }
}
