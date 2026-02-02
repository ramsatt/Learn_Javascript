import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ContentAnalysisPage } from './content-analysis.page';

const routes: Routes = [
  {
    path: '',
    component: ContentAnalysisPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContentAnalysisPageRoutingModule {}
