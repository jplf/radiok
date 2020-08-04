import { Component, OnInit } from '@angular/core';
import { Station } from './station.interface';
import { ConfigService } from '../config.service';

@Component({
  selector: 'app-station',
  templateUrl: './station.component.html',
  styleUrls: ['./station.component.scss']
})

export class StationComponent implements OnInit {

    // If the selected station key is invalid an exception is thrown
    constructor(private configService: ConfigService) {
    }

    ngOnInit(): void {
        
        var key = this.configService.stationKey;
        
        var s : Station = this.findStation(key);
        
        if (s === undefined) {
            throw new Error('Station ' + key + ' not found !' );
        }
        this.station = s;
        
    }

    onSelect(idx: number): void {
        console.log("Station : " + idx);
        this.station = this.stationList[idx];
        this.configService.stationKey = this.station.key;
    }

    // The array of always used stations
    readonly stationList: Station[] = [{"key": "10", "name": 'FIP'},
                              {"key": "11", "name": 'France Musique'}
                             ];

    // Finds a station knowing the key. Returns undefined if not found.
    private findStation(key : string) : Station {
        return this.stationList.find(s => s.key === key);
    }
    
    // The current selected station
    station: Station;

    // Returns the list of stations
    get stations(): Station[] {
        return this.stationList;
    }
}
