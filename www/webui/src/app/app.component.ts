import { Component, OnInit } from '@angular/core';
import { ConfigService } from './config.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent  implements OnInit {
    title = 'RadioK';
    version='6.0 20 July 2020';
    
    constructor(private configService: ConfigService) {
        console.log("Application component created");
    }
    
    ngOnInit(): void {
        console.log("Version : " + this.configService.version);
        console.log("Player at : " + this.configService.playerUrl);
    }
}
