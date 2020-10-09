import { Injectable } from '@angular/core';
import { ConfigService } from '../config.service';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { catchError, retry } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RadioService {

    constructor(private configService: ConfigService,
                private http: HttpClient) {
        console.log('Radio service created');
    }

    readonly radioPlayer : string = this.configService.playerUrl;

    // New onOff just set
    switchOnOff(onOff : boolean) {

        var endPoint;

        this.configService.radioOnOff = onOff;
        var key = this.configService.stationKey;

        if (onOff) {
            endPoint = this.radioPlayer + 'listen/' + key;
            console.log("Radio on station " + key);
        }
        else {
            endPoint = this.radioPlayer  + 'off';
            console.log("Radio switched off");
        }
        
        // cd $RADIOG_HOME/backend
        // npm run start
        // curl localhost:18300/player | jq
        
         return this.http.get(endPoint).pipe(catchError(this.handleError));
    }
    
    // Take care of possible errors.
    private handleError(error: HttpErrorResponse) {
        
        console.log(`Backend error : ${error.message}`);
        
        return throwError('Cannot get connected to the player');
    };
    
   // Changes the output volume
    setVolume(value: number) {
        
        this.configService.volume = value;
        var volume = value.toString();
        
        var endPoint = this.radioPlayer + 'set?volume=' + volume;
        console.log("Call " + endPoint);
        
        return this.http.get(endPoint).pipe(catchError(this.handleError));
    }
}
