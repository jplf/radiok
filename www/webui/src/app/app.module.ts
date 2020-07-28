import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule, NgbButtonsModule } from '@ng-bootstrap/ng-bootstrap';
import { StationComponent } from './station/station.component';
import { RadioComponent } from './radio/radio.component';
import { StateComponent } from './state/state.component';
import { TriggerComponent } from './trigger/trigger.component';
import { HomeComponent } from './home/home.component';

@NgModule({
    declarations: [
        AppComponent,
        StationComponent,
        RadioComponent,
        StateComponent,
        TriggerComponent,
        HomeComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,
        NgbButtonsModule,
        FormsModule,
        NgbModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
