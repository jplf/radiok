import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Trigger } from './trigger/trigger';

import { environment } from './../environments/environment';

@Injectable({
  providedIn: 'root'
})

// From the example found in :
// stackoverflow.com/questions/43193049/app-settings-the-angular-way

export class ConfigService {

    private config: any;

    // Whether the radio is on or off
    onOff: boolean;

    constructor(private http: HttpClient) {
        this.onOff = false;
    }

    // Reads the configuration from the asset directory
    loadConfig(): void {

        let radiokConf = 'radiok-conf.json';
        const key = 'configFile';
        if (environment.hasOwnProperty(key)) {
            radiokConf = environment[key];
        }

        console.log('Configuration found in ' + radiokConf);

        return this.http.get('/assets/' + radiokConf)
            .toPromise()
            .then(data => {
                this.config = data;
            });
    }

    // Returns the current version string. Note the typescript syntax
    get version(): string {
        return this.config.version;
    }

    // Returns the trigger parameters
    get trigger(): Trigger {
        return this.config.trigger;
    }

    // Returns whether the radio is on or off
    get radioOnOff(): boolean {
        return this.onOff;
    }
    // Sets whether the radio is on or off
    set radioOnOff(flag: boolean)  {
        this.onOff = flag;
    }

    // Returns the key of the selected station
    get stationKey(): string {
        return this.config.stationKey;
    }

    // Keeps the key of the selected station
    set stationKey(key: string) {
        this.config.stationKey = key;
    }

    // Returns the volume of the radio
    get volume(): number {
        return this.config.volume;
    }

    // Keeps the volume value. Avoids out of bounds value.
    set volume(value: number): void {
        if (value > 100) {
            value = 100;
        }
        else if (value < 0) {
            value = 0;
        }
        this.config.volume = value;
    }

    // Returns the end point of the backend player
    get playerUrl(): string {

        if (!this.config) {
            throw Error('Config file not loaded !');
        }

        return this.config.playerUrl;
    }

}
