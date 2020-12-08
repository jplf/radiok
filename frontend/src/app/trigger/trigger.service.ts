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

        console.log('Trigger service created');
    }

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

        const crontab = this.buildCrontab();
        this.scheduler.setCrontab(crontab);

        if (this.trigger.enabled) {
           this.scheduler.start();
        }
    }

    // Returns the time to trig.
    getTime(): any {
        return {hour: this.trigger.hour, minute: this.trigger.minute};
    }

    // Returns the time to trig as a string.
    getFormattedTime(): string {

        const s = this.trigger.hour.toString().padStart(2, '0') + ':' +
        this.trigger.minute.toString().padStart(2, '0');

        return s;
    }

    // Enables  the trigger.
    enable(): void {

        this.trigger.enabled = true;

        const work = (): void => {
            this.radio.switchOnOff(true)
                .subscribe(data => {
                    console.log('Radio is switched on');
                },
                error => {
                    console.log('Error switching the radio : ' + error);
                });

            // After a duration given in minutes stop the work
            setTimeout((msg: string) => {

                this.radio.switchOnOff(false)
                    .subscribe(data => {
                        console.log(msg);
                    });
            },
            this.trigger.duration * 60000, 'Radio is switched off');
        };

        const crontab = this.buildCrontab();
        this.scheduler.setJob(crontab, work);

        this.scheduler.start();
    }

    // Builds the crontab string.
    // Example : every minute starts playing
    // var crontab = '0 * * * * *';
    private buildCrontab(): string {

        let crontab = '0 ' + this.trigger.minute + ' ' + this.trigger.hour;
        if (this.trigger.weEnabled) {
            crontab = crontab + ' * * *';
        }
        else {
            crontab = crontab + ' * * 1-5';
        }

        return crontab;
    }

    // Disables the trigger.
    disable(): void {
        this.trigger.enabled = false;
        this.scheduler.stop('Trigger manually disabled');
    }

    // Is the trigger set.
    isEnabled(): boolean {
       return this.trigger.enabled;
    }

    // Enables or disables the trigger on week-end.
    enableWe(flag: boolean): void {
       this.trigger.weEnabled = flag;
    }

    // Is the trigger set on week-end.
    isWeEnabled(): boolean {
       return this.trigger.weEnabled;
    }
}
