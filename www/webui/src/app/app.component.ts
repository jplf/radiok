import { Component, OnInit } from '@angular/core';
import { ConfigService } from './config.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent  implements OnInit {
    
    readonly title : string = 'RadioK';
    readonly version : string;
    
    constructor(private configService: ConfigService) {
        console.log("Application component created");
        this.version =  this.configService.version;
    }
    
    ngOnInit(): void {
        console.log("Player at : " + this.configService.playerUrl);
    }
}
