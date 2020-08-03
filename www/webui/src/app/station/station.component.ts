import { Component, OnInit } from '@angular/core';
import { Station } from './station.interface';

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
        this.station = this.stationList[1];
    }

    onSelect(idx: number): void {
        console.log("Station : " + idx);
        this.station = this.stationList[idx];
    }

    // The array of always used stations
    stationList: Station[] = [{"key": "10", "name": 'FIP'},
                              {"key": "11", "name": 'France Musique'}
                             ];

    // The current selected station
    station: Station;

    // Returns the list of stations
    getStationList(): Station[] {
        return this.stationList;
    }
}
