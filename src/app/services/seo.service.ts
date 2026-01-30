import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private baseUrl = 'https://codingtamilan.in';

  constructor(
    private titleService: Title,
    private metaService: Meta
  ) {}

  updateTitle(title: string) {
    this.titleService.setTitle(title);
  }

  updateMetaTags(config: {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: string;
  }) {
    const {
      title,
      description,
      keywords = 'coding, programming, tutorials, learn to code',
      image = `${this.baseUrl}/assets/images/img_javascript_480.jpg`,
      url = this.baseUrl,
      type = 'website'
    } = config;

    // Update title
    this.titleService.setTitle(title);

    // Update or add meta tags
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ name: 'keywords', content: keywords });
    
    // Open Graph
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:image', content: image });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:type', content: type });

    // Twitter
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: image });
    this.metaService.updateTag({ name: 'twitter:url', content: url });
  }

  updateCanonicalUrl(url: string) {
    const head = document.getElementsByTagName('head')[0];
    let element: HTMLLinkElement | null = document.querySelector(`link[rel='canonical']`) || null;
    
    if (!element) {
      element = document.createElement('link') as HTMLLinkElement;
      element.setAttribute('rel', 'canonical');
      head.appendChild(element);
    }
    
    element.setAttribute('href', url);
  }

  generateCourseMetaTags(courseId: string, courseTitle: string) {
    const title = `Learn ${courseTitle} - Free Tutorial | Coding Tamilan`;
    const description = `Master ${courseTitle} with our comprehensive free tutorial. Interactive lessons, code examples, and hands-on practice. Start learning ${courseTitle} today!`;
    const keywords = `${courseTitle.toLowerCase()}, ${courseTitle.toLowerCase()} tutorial, learn ${courseTitle.toLowerCase()}, ${courseTitle.toLowerCase()} course, ${courseTitle.toLowerCase()} for beginners`;
    const url = `${this.baseUrl}/course/${courseId}`;

    this.updateMetaTags({ title, description, keywords, url });
    this.updateCanonicalUrl(url);
  }

  generateTutorialMetaTags(tutorialTitle: string, courseTitle: string, fileName: string) {
    const title = `${tutorialTitle} - ${courseTitle} Tutorial | Coding Tamilan`;
    const description = `Learn ${tutorialTitle} in ${courseTitle}. Step-by-step tutorial with examples and explanations. Part of our comprehensive ${courseTitle} course.`;
    const keywords = `${tutorialTitle.toLowerCase()}, ${courseTitle.toLowerCase()}, tutorial, programming, coding`;
    const url = `${this.baseUrl}/tutorial/${fileName.replace('.html', '')}`;

    this.updateMetaTags({ title, description, keywords, url, type: 'article' });
    this.updateCanonicalUrl(url);
  }

  generateHomeMetaTags() {
    const title = 'Coding Tamilan - Learn Programming for Free | JavaScript, Python, Java & More';
    const description = 'Master programming with free interactive tutorials. Learn JavaScript, Python, Java, React, Angular, Node.js and 20+ technologies. Gamified learning with progress tracking.';
    const keywords = 'learn programming, coding tutorials, JavaScript, Python, Java, React, Angular, free coding course, web development';
    
    this.updateMetaTags({ title, description, keywords, url: this.baseUrl });
    this.updateCanonicalUrl(this.baseUrl);
  }
}
