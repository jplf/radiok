import { Component, OnInit, Input } from '@angular/core';
import { OnChanges, SimpleChange } from '@angular/core';
import { RadioService } from './radio.service';

@Component({
  selector: 'app-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.scss']
})

export class RadioComponent implements OnInit {
    
    // Whether the player is playing (true) or not (false)
    @Input() onOff: boolean = false;
    
    constructor(private radioService: RadioService) {
        console.log("Radio component created");
    }
    
     ngOnInit(): void {
        console.log("Radio component initialized");
    }

    status : string = this.onOff ? 'On' : 'Off';
    
    // Switches on or off the radio
    onSwitch(): void {
        // Toggle the status
        this.status =  (! this.onOff) ? 'On' : 'Off';
        console.log("Radio changed to " + this.status);
        
        this.radioService.switchOnOff(this.onOff, '0');
    }
     
    onChange(value: number): void {
        console.log("Volume : " + value);
        this.radioService.setVolume(value);
    }
}
