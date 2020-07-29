import { Component, OnInit, Input } from '@angular/core';
import { TriggerService } from '../trigger/trigger.service';

@Component({
  selector: 'app-state',
  templateUrl: './state.component.html',
  styleUrls: ['./state.component.scss']
})

export class StateComponent implements OnInit {
    

    constructor(private triggerService: TriggerService) {
        console.log("State component created");
    }

    ngOnInit(): void {
        console.log("State component initialized");
    }
    
    // Whether alarms is set or not
    @Input() alarmSet: boolean = this.triggerService.isEnabled();
    
    // Whether alarms goes off also the week-end
    @Input() weIncluded: boolean = this.triggerService.isWeEnabled();
    
    // The formatted time
    @Input() alarmTime: string = this.triggerService.getFormattedTime();
}
