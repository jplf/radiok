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
        this.station = this.stationList[0];
    }

    onSelect(s: string): void {
        console.log("Station : " + s)
        this.station = s;
    }

    // The array of good stations
    stationList: string[] = ['FIP', 'France Musique'];

    // The current selected station
    station: string;

    // Returns the list of stations
    getStationList(): string[] {
        return this.stationList;
    }
}
