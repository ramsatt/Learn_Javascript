import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { MigrationComponent } from './pages/admin/migration/migration.component';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [

  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'tutorial/:file',
    loadChildren: () => import('./pages/tutorial/tutorial.module').then( m => m.TutorialPageModule)
  },
  {
    path: 'chapter-list/:title',
    loadChildren: () => import('./pages/chapter-list/chapter-list.module').then( m => m.ChapterListPageModule)
  },
  {
    path: 'certificate/:course',
    loadChildren: () => import('./pages/certificate/certificate.module').then( m => m.CertificatePageModule)
  },
  {
    path: 'tutorials',
    loadChildren: () => import('./pages/tutorials/tutorials.module').then( m => m.TutorialsPageModule)
  },
  {
    path: 'playground',
    loadChildren: () => import('./pages/playground/playground.module').then( m => m.PlaygroundPageModule)
  },
  {
    path: 'content-analysis',
    loadChildren: () => import('./pages/content-analysis/content-analysis.module').then( m => m.ContentAnalysisPageModule)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/dashboard/admin-dashboard.page').then(m => m.AdminDashboardPage),
    canActivate: [AdminGuard]
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, useHash: true })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
