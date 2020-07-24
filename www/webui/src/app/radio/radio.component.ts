import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.scss']
})

export class RadioComponent implements OnInit {

    constructor() {
        console.log("Radio component created")
    }

    ngOnInit(): void {
        console.log("Radio component initialized")
    }
    
    onChange(value: number): void {
        console.log("Volume : " + value)
    }

}
