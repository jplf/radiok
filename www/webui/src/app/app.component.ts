import { Component, OnInit } from '@angular/core';
import { ConfigService } from './config.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent  implements OnInit {
    
    title : string = 'RadioK';
    version : string;
    
    constructor(private configService: ConfigService) {
        console.log("Application component created");
    }
    
    ngOnInit(): void {
        this.version =  this.configService.version;
        console.log("Player at : " + this.configService.playerUrl);
    }
}
