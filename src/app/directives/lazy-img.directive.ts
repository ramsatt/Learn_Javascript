import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: 'img[appLazyImg]',
  standalone: true
})
export class LazyImgDirective implements OnInit {
  @Input() src: string = '';
  @Input() alt: string = '';
  
  constructor(private el: ElementRef<HTMLImageElement>) {}
  
  ngOnInit() {
    const img = this.el.nativeElement;
    
    // Enable native lazy loading
    img.loading = 'lazy';
    
    // Enable async decoding for better performance
    img.decoding = 'async';
    
    // Set alt text for accessibility
    if (this.alt) {
      img.alt = this.alt;
    }
    
    // Set src
    if (this.src) {
      img.src = this.src;
    }
  }
}
