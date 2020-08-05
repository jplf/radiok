import { Injectable } from '@angular/core';
import { ConfigService } from '../config.service';

@Injectable({
  providedIn: 'root'
})
export class RadioService {

    constructor(private configService: ConfigService) {
        console.log('Radio service created');
    }

    readonly radioPlayer : string = this.configService.playerUrl;

    // New onOff just set
    switchOnOff(onOff : boolean) {

        var endPoint;

        this.configService.radioOnOff = onOff;
        var key = this.configService.stationKey;

        if (onOff) {
            endPoint = this.radioPlayer + 'listen/' + key;
            console.log("Radio on station " + key);
        }
        else {
            endPoint = this.radioPlayer  + 'off';
            console.log("Radio switched off");
        }
        
        return;
    }
    
    // Changes the output volume
    setVolume(value: number) {
        
        this.configService.volume = value;
        var volume = value.toString();
        
        var endPoint = this.radioPlayer + 'set?volume=' + volume;
        console.log("Call " + endPoint);
        
        return;
    }
}
