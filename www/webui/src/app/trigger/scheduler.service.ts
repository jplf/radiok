import { Injectable } from '@angular/core';
import { CronJob} from 'cron';

@Injectable({
  providedIn: 'root'
})

export class SchedulerService {

    constructor() {
        console.log('SchedulerService created');
    }

    job : any;

    setJob(work) {
        var todo = (): void => console.log('Good job JP');
        this.job = new CronJob('*/5 * * * * *', todo);
    };

    start(): void {
        this.job.start();
    }

    stop(): void {
        this.job.stop();
    }
}

