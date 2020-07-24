import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RadioComponent } from './radio/radio.component';
import { StateComponent } from './state/state.component';

const routes: Routes = [
    { path: 'radio', component: RadioComponent },
    { path: 'state', component: StateComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
