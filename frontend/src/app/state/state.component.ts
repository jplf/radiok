import { Component, Input } from '@angular/core';
import { TriggerService } from '../trigger/trigger.service';

@Component({
  selector: 'app-state',
  templateUrl: './state.component.html',
  styleUrls: ['./state.component.scss']
})

export class StateComponent {

    constructor(private triggerService: TriggerService) {
    }


    // Whether alarms is set or not
    @Input() readonly alarmSet: boolean = this.triggerService.isEnabled();

    // Whether alarms goes off also the week-end
    @Input() readonly weIncluded: boolean = this.triggerService.isWeEnabled();

    // The formatted time
    @Input() readonly alarmTime: string = this.triggerService.getFormattedTime();
}
