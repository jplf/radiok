import { Injectable } from '@angular/core';
import { ConfigService } from '../config.service';

@Injectable({
  providedIn: 'root'
})
export class RadioService {

    constructor(private configService: ConfigService) {
        console.log('Radio service created');
    }

    radioPlayer : string = this.configService.playerUrl;
    
    switchOnOff(status : boolean, key: string) {

        var endPoint;
        var flag = ! status;
        
        if (flag) {
            endPoint = this.radioPlayer + 'listen/' + key;
        }
        else {
            endPoint = this.radioPlayer  + 'off';
        }

        console.log("Call " + endPoint);
        
        return;
    }
    
    // Changes the output volume
    setVolume(value: number) {
        
        var volume = value.toString();
        
        var endPoint = this.radioPlayer + 'set?volume=' + volume;
        console.log("Call " + endPoint);
        
        return ;
    }
}
