import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

// From the example found in :
// stackoverflow.com/questions/43193049/app-settings-the-angular-way

export class ConfigService {
    
    private config: any;
    
    constructor(private http: HttpClient) {
        console.log('Configuration service created');
    }

    loadConfig() {
        return this.http.get('/assets/radiok-conf.json')
            .toPromise()
            .then(data => {
                this.config = data;
            });
    }
     
    // Returns the current version string
    get version(): string {
        return this.config.version;
    }
     
    // Returns the volume of the radio
    get volume(): number {
        return this.config.volume;
    }
   
    // Returns the end point of the backend player
    get playerUrl(): string {

        if (!this.config) {
            throw Error('Config file not loaded !');
        }

        return this.config.playerUrl;
    }

}
