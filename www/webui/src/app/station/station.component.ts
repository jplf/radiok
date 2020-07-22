import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-station',
  templateUrl: './station.component.html',
  styleUrls: ['./station.component.scss']
})

export class StationComponent implements OnInit {

    constructor() {
        console.log("Station component created") 
    }

    ngOnInit(): void {
        console.log("Station component initialized")
    }
    
    onSelect(s: string): void {
        console.log("Station : " + s)
    }

    // The array of stations
    stationList: string[] = ["FIP", "France Musique"];


    // Returns the list of stations
    getStationList(): Station[] {
        return this.stationList;
    }    

}
