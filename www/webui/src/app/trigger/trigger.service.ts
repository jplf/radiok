import { Injectable } from '@angular/core';
import { Trigger } from './trigger';
import { SchedulerService } from './scheduler.service';
import { RadioService } from '../radio/radio.service';
import { ConfigService } from '../config.service';
import _ from 'lodash';

@Injectable({
  providedIn: 'root'
})

export class TriggerService {

    constructor(private scheduler: SchedulerService,
                private config: ConfigService,
                private radio: RadioService) {
        
        console.log("Trigger service created");
    };

    // The current trigger data. Note the json cloning.
    private trigger: Trigger = _.clone(this.config.trigger);

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

    private count: number = 0;
    // Enables  the trigger.
    enable(): void {
        
        this.trigger.enabled = true;
        
        //var todo = (): void => console.log('Good job JP ' + this.count);
        var work = (): void => {
            this.radio.switchOnOff(true);
            setTimeout((s: string) => { console.log(s)},
                   this.trigger.duration * 1000, 'timeouté');

        };
        
        var crontab = '*/20 * * * * *';
        this.scheduler.setJob(crontab, work);
        
        this.scheduler.start();
    }

    // Disables the trigger.
    disable(): void {
        this.trigger.enabled = false;
        this.scheduler.stop('Manually disabled');
        this.count++;
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
