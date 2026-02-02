import { Component, OnInit } from '@angular/core';
import { TutorialService, Course } from '../../services/tutorial.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tutorials',
  templateUrl: './tutorials.page.html',
  styleUrls: ['./tutorials.page.scss'],
  standalone: false,
})
export class TutorialsPage implements OnInit {
  
  allTutorials: Course[] = []; // Store full list
  tutorials: Course[] = [];    // Displayed list
  loading = true;
  searchTerm = '';

  constructor(
    private tutorialService: TutorialService,
    private router: Router
  ) { }

  ngOnInit() {
    this.tutorialService.getCourses().subscribe({
      next: (data) => {
        this.allTutorials = data;
        this.tutorials = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load courses', err);
        this.loading = false;
      }
    });
  }
  
  filterCourses(event: any) {
      const query = event.target.value.toLowerCase();
      this.searchTerm = query;
      
      if (!query) {
          this.tutorials = this.allTutorials;
          return;
      }
      
      this.tutorials = this.allTutorials.filter(course => {
          return course.title.toLowerCase().includes(query) || 
                 course.description.toLowerCase().includes(query) ||
                 (course.level && course.level.toLowerCase().includes(query));
      });
  }

  onCourseSelect(course: Course) {
    if (course.file) {
      this.tutorialService.setCourse(course.file);
      this.loading = true; 
      
      this.tutorialService.getMenu(course.file).subscribe({
          next: (sections) => {
              this.loading = false;
              if (sections && sections.length > 0 && sections[0].items.length > 0) {
                   const firstFile = sections[0].items[0].file;
                   this.router.navigate(['/tutorial', firstFile]);
              } else {
                   console.log('No chapters found');
                   this.loading = false;
              }
          },
          error: (err) => {
              console.error(err);
              this.loading = false;
          }
      });
    }
  }
}
