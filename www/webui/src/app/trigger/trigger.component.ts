import { Component, OnInit, Input} from '@angular/core';
import { OnChanges, SimpleChange } from '@angular/core';
import { TriggerService } from './trigger.service';

@Component({
  selector: 'app-trigger',
  templateUrl: './trigger.component.html',
  styleUrls: ['./trigger.component.scss']
})

export class TriggerComponent implements OnInit {
    
    // Whether the trigger is enabled or not
    @Input() alarmSet: boolean;
    // Whether alarms goes off also the week-end
    @Input() weIncluded: boolean;
    // The trigger time
    @Input() triggerTime: any;

    constructor(private triggerService: TriggerService) {
        console.log("Trigger component created")
    }

    ngOnInit(): void {
        console.log("Trigger component initialized")
        this.triggerTime = this.triggerService.getTime();
        this.alarmSet    = this.triggerService.isEnabled();
        this.weIncluded  = this.triggerService.isWeEnabled();
        
        this.setTriggerStatus(this.alarmSet);
        this.setWeStatus(this.weIncluded);
    }
    
    // Change the trigger time
    onChange(): void {
        // Get the time
        var t = this.triggerTime;
        this.triggerService.setTime(t.hour, t.minute);
        console.log("Trigger set to " + t.hour + ':' + t.minute);
    }

    // A string showing the status
    triggerStatus : string;
   
    setTriggerStatus(flag: boolean): void {
        this.triggerStatus = flag ? 'Set' : 'Unset';
    }
    
    // Enables or disables the trigger
    onSwitch(): void {
        // Toggle the status
        var flag = ! this.alarmSet;
        this.setTriggerStatus(flag);
        this.triggerService.enable(flag);
        console.log("Trigger changed to " + this.triggerStatus);
    }
    
    // A string showing the status
    weStatus : string;
   
    setWeStatus(flag: boolean): void {
        this.weStatus = flag ? 'week-end' : 'work days';
    }
    
    // Enables or disables the trigger on week-end
    onToggle(): void {
        // Toggle the status
        var flag = ! this.weIncluded;
        this.setWeStatus(flag);
        this.triggerService.enableWe(flag);
        console.log("Trigger changed to " + this.weStatus);
    }

}
