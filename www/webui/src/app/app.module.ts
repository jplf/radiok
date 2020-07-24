import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { StationComponent } from './station/station.component';
import { RadioComponent } from './radio/radio.component';
import { StateComponent } from './state/state.component';

@NgModule({
  declarations: [
    AppComponent,
    StationComponent,
    RadioComponent,
    StateComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
