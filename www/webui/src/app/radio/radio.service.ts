import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RadioService {

    constructor() {
        console.log("Radio service created");
    }
    
    switchOnOff(status : boolean, key: string) {
        
        if (status) {
            url = url + 'listen/' + key;
        }
        else {
            url = url + 'off';
        }
        
        return;
    }
    
    // Changes the output volume
    setVolume(value: number) {
        
        var volume : string = value.toString();
        
        var url = config.backend_player;
        
        url = url + 'set?volume=' + volume;
        
        return ;
    }
}
