import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { RadioComponent } from './radio/radio.component';
import { StateComponent } from './state/state.component';
import { TriggerComponent } from './trigger/trigger.component';

const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'trigger', component: TriggerComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
