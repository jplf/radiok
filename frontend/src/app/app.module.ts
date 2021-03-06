import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule, NgbButtonsModule } from '@ng-bootstrap/ng-bootstrap';
import { StationComponent } from './station/station.component';
import { RadioComponent } from './radio/radio.component';
import { MessagesComponent } from './messages/messages.component';
import { StateComponent } from './state/state.component';
import { TriggerComponent } from './trigger/trigger.component';
import { HomeComponent } from './home/home.component';
import { ConfigService } from './config.service';

@NgModule({
    declarations: [
        AppComponent,
        StationComponent,
        RadioComponent,
        MessagesComponent,
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
    providers: [
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [ConfigService],
            useFactory: (configService: ConfigService) => {
                return () => {
                    console.log('The configuration is loaded');
                    return configService.loadConfig();
                };
            }
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
