import { Component, Input, OnInit } from '@angular/core';
import { OnChanges, SimpleChange } from '@angular/core';
import { RadioService } from './radio.service';
import { MessageService } from '../messages/message.service';
import { ConfigService } from '../config.service';

@Component({
  selector: 'app-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.scss']
})

export class RadioComponent implements OnInit {
    
    // Whether the player is playing (true) or not (false)
    @Input() onOff: boolean;
    // The volume to play as a number
    @Input() volume: number;
    
    constructor(private radioService: RadioService,
                private messageService: MessageService,
                private configService: ConfigService) {
    }

    status : string = this.onOff ? 'On' : 'Off';
    
    ngOnInit(): void {
        this.onOff = this.configService.radioOnOff;
        this.status =  this.onOff ? 'On' : 'Off';
        
        this.volume = this.configService.volume;
        this.radioService.setVolume(this.volume);
    }
    
    // Switches  the radio on or off
    onSwitch(): void {
        // Toggle the status: previously this.onOff -> new flag
        var flag : boolean = ! this.onOff;
        this.status =  flag ? 'On' : 'Off';
        
        this.radioService.switchOnOff(flag)
            .subscribe(data => {
                console.log('Player is actived');
                this.messageService.display('Player is actived !');

            },
            error => {
                console.log('Error switching the player : ' + error);
                this.messageService.display('Player error : ' + error);
            });
    }
    
    // Change the output volume
    onChange(value: number): void {
        this.radioService.setVolume(value)
            .subscribe(data => {
                console.log('Volume set to ' + value);
            },
            error => {
                console.log('Error changing the volume : ' + error);
                this.messageService.display('Volume error : ' + error);
           });
    }
}
