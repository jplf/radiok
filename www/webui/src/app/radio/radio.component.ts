import { Component, OnInit, Input } from '@angular/core';
import { OnChanges, SimpleChange } from '@angular/core';

@Component({
  selector: 'app-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.scss']
})

export class RadioComponent implements OnInit {
    
    // Whether the player is playing (true) or not (false)
    @Input() onOff: boolean = false;
    
    constructor() {
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
    }
     
    onChange(value: number): void {
        console.log("Volume : " + value);
    }
}
