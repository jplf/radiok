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
    private trigger: Trigger = {
        hour: 6,
        minute: 34,
        enabled: true,
        weEnabled: false
    };

    getTrigger(): Trigger {
        return this.trigger;
    };

    // Changes the trigger time
    setTime(hour: number, minute: number): void {
        
        if (hour < 0 || hour > 23) {
            throw new RangeError('Invalid hour value : ' + hour);
        }
        else if (minute < 0 || minute > 59) {
            throw new RangeError('Invalid minute value : ' + minute);
        }
        
        this.trigger.hour = hour;
        this.trigger.minute = minute;
    };

    // Returns the time to trig.
    getTime() : any {
        return {"hour": this.trigger.hour, "minute": this.trigger.minute}; 
    }

    // Returns the time to trig as a string.
    getFormattedTime() : string {
        
        var s = this.trigger.hour.toString().padStart(2, '0') + ':' +
        this.trigger.minute.toString().padStart(2, '0');
       
        return s; 
    }

    // Enables or disables the trigger on week days.
    enable(flag : boolean): void {
       this.trigger.enabled = flag; 
    }
    
    // Is the trigger set.
    isEnabled(): boolean {
       return this.trigger.enabled; 
    }
    
    // Enables or disables the trigger on week-end.
    enableWe(flag : boolean): void {
       this.trigger.weEnabled = flag; 
    }
    
    // Is the trigger set on week-end.
    isWeEnabled(): boolean {
       return this.trigger.weEnabled; 
    }
}
