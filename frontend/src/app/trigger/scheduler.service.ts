import { Injectable } from '@angular/core';
import { CronJob, CronTime } from 'cron';

@Injectable({
  providedIn: 'root'
})

export class SchedulerService {

    constructor() {
        console.log('SchedulerService created');
    }

    job : any = undefined;

    setJob(crontab: string, work: any): void {
        this.job = new CronJob(crontab, work);
        console.log('New job set ' + crontab);
    };

    // Change the periodicity
    setCrontab(crontab: string): void {
        if (this.job === undefined) {
            return;
        }
        this.job.setTime(new CronTime(crontab));
        console.log('New crontab set ' + crontab);
    };

    // Launch the job for a given duration in seconds.
    start(): void {
        
        if (this.job === undefined) {
            return;
        }
        
        this.job.start();
    }

    stop(msg: string): void {
        
        if (this.job === undefined) {
            return;
        }
        if (msg) {
          console.log('Job stopped : ' + msg);  
        }
        
        this.job.stop();
    }
}

