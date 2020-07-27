import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-trigger',
  templateUrl: './trigger.component.html',
  styleUrls: ['./trigger.component.scss']
})

export class TriggerComponent implements OnInit {

    constructor() {
        console.log("Trigger component created")
    }

    ngOnInit(): void {
        console.log("Trigger component initialized")
    }
}
