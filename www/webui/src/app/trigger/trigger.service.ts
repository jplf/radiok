import { Injectable } from '@angular/core';
import { Trigger } from './trigger';

@Injectable({
  providedIn: 'root'
})

export class TriggerService {

    constructor() {
        console.log("Trigger service created");
    };

    // The current trigger data
    private trigger: Trigger = undefined;

    getTrigger(): Trigger {
        return this.trigger;
    };

    // Changes the trigger time
    setTriggerTime(hour: number, minute: number): void {
        
        if (hour < 0 || hour > 23) {
            throw new RangeError('Invalid hour value : ' + hour);
        }
        else if (minute < 0 || minute > 59) {
            throw new RangeError('Invalid minute value : ' + minute);
        }
        
        this.trigger.hour = hour;
        this.trigger.minute = minute;
    };

    // Enables or disables the trigger on week days.
    enableTrigger(flag : boolean): void {
       this.trigger.enabled = flag; 
    }
    
    // Enables or disables the trigger on week-end.
    enableWeTrigger(flag : boolean): void {
       this.trigger.week-end = flag; 
    }
}
