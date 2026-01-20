import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TutorialService, TutorialSection, TutorialItem } from '../../services/tutorial.service';

@Component({
  selector: 'app-chapter-list',
  templateUrl: './chapter-list.page.html',
  styleUrls: ['./chapter-list.page.scss'],
  standalone: false,
})
export class ChapterListPage implements OnInit {
  categoryTitle: string = '';
  chapterList: TutorialItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tutorialService: TutorialService
  ) { }

  ngOnInit() {
    this.categoryTitle = this.route.snapshot.paramMap.get('title') || '';
    
    if (this.categoryTitle) {
      this.tutorialService.getMenu().subscribe(sections => {
        const section = sections.find(s => s.title === this.categoryTitle);
        if (section) {
          this.chapterList = section.items;
        }
      });
    }
  }

  isComplete(file: string): boolean {
    return this.tutorialService.isComplete(file);
  }

  get isCategoryComplete(): boolean {
    if (this.chapterList.length === 0) return false;
    return this.chapterList.every(item => this.isComplete(item.file));
  }

  openTutorial(file: string) {
    this.router.navigate(['/tutorial', file]);
  }

  openCertificate() {
    this.router.navigate(['/certificate', this.categoryTitle]);
  }
}
