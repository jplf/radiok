import { Component, OnInit, Input} from '@angular/core';
import { OnChanges, SimpleChange } from '@angular/core';

@Component({
  selector: 'app-trigger',
  templateUrl: './trigger.component.html',
  styleUrls: ['./trigger.component.scss']
})

export class TriggerComponent implements OnInit {
    
    // Whether the trigger is enabled or not
    @Input() setUnset: boolean = false;
    // Whether alarms goes off also the week-end
    @Input() weIncluded: boolean = false;
    // The trigger time
    @Input() triggerTime: any = {"hour" : 6, "minute" : 59};

    constructor() {
        console.log("Trigger component created")
    }

    ngOnInit(): void {
        console.log("Trigger component initialized")
    }
    
    // Change the trigger time
    onChange(): void {
        // Get the time
        var t = this.triggerTime;
        console.log("Trigger set to " + t.hour + ':' + t.minute);
    }
     
    triggerStatus : string = this.setUnset ? 'Set' : 'Unset';
    
    // Enables or disables the trigger
    onSwitch(): void {
        // Toggle the status
        this.triggerStatus =  (! this.setUnset) ? 'Set' : 'Unset';
        console.log("Trigger changed to " + this.triggerStatus);
    }
    
    weStatus : string = this.weIncluded ? 'week-end' : 'work days';
    
    // Enables or disables the trigger on week-end
    onToggle(): void {
        // Toggle the status
        this.weStatus =  (! this.weIncluded) ? 'week-end' : 'work days';
        console.log("Trigger changed to " + this.weStatus);
    }

}
