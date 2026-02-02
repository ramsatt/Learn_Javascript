import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TutorialsPageRoutingModule } from './tutorials-routing.module';

import { TutorialsPage } from './tutorials.page';
import { TutorialCardComponent } from '../../components/tutorial-card/tutorial-card.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TutorialsPageRoutingModule,
    TutorialCardComponent
  ],
  declarations: [TutorialsPage]
})
export class TutorialsPageModule {}
