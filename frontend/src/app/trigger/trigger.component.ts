import { Component, OnInit, Input} from '@angular/core';
import { OnChanges, SimpleChange } from '@angular/core';
import { MessageService } from '../messages/message.service';
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
    @Input() alarmTime: any;

    // A string showing the work days status
    triggerStatus: string;

    // A string showing week-end the status
    weStatus: string;

    constructor(private triggerService: TriggerService,
                private messageService: MessageService) {
        console.log('TriggerComponent created');
    }

    ngOnInit(): void {
        // console.log('Trigger component initialized')
        this.alarmTime = this.triggerService.getTime();
        this.alarmSet    = this.triggerService.isEnabled();
        this.weIncluded  = this.triggerService.isWeEnabled();

        this.setTriggerStatus(this.alarmSet);
        this.setWeStatus(this.weIncluded);
    }

    // Change the trigger time
    onChange(): void {
        // Get the time
        const t = this.alarmTime;
        console.log('Trigger set to ', t.hour, t.minute);
        this.triggerService.setTime(t.hour, t.minute);
    }

    setTriggerStatus(flag: boolean): void {
        this.triggerStatus = flag ? 'Set' : 'Unset';
    }

    // Enables or disables the trigger
    onSwitch(): void {
        // Toggle the status: previously this.alarmSet -> new flag
        const flag = ! this.alarmSet;
        this.setTriggerStatus(flag);
        this.messageService.display('Trigger switched !');
        console.log('Trigger changed to ' + this.triggerStatus);

        if (flag) {
            this.triggerService.enable();
        }
        else {
            this.triggerService.disable();
        }
    }


    setWeStatus(flag: boolean): void {
        this.weStatus = flag ? 'week-end' : 'work days';
    }

    // Enables or disables the trigger on week-end
    onToggle(): void {
        // Toggle the status
        const flag = ! this.weIncluded;
        this.setWeStatus(flag);
        this.triggerService.enableWe(flag);
        console.log('Trigger changed to ' + this.weStatus);
    }
}
