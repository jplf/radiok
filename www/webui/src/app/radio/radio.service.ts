import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RadioService {

    constructor() {
        console.log('Radio service created');
    }

    radioPlayer : string = 'http://localhost:18300';
    
    switchOnOff(status : boolean, key: string) {

        var endPoint;
        
        if (status) {
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
        
        var volume : string = value.toString();
        
        var endPoint = this.radioPlayer + 'set?volume=' + volume;
        console.log("Call " + endPoint);
        
        return ;
    }
}
