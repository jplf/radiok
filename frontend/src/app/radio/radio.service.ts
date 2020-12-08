import { Injectable } from '@angular/core';
import { ConfigService } from '../config.service';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { map, catchError} from 'rxjs/operators';
import { BehaviorSubject, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RadioService {

    constructor(private configService: ConfigService,
                private http: HttpClient) {
        console.log('Radio service created');
    }

    readonly radioPlayer: string = this.configService.playerUrl;
    radioPlaying$ = new BehaviorSubject<boolean>(false);

    // Return whether the radio is on or off
    isRadioPlaying(): Observable<boolean> {
        return this.radioPlaying$;
    }

    // New onOff just set
    switchOnOff(onOff: boolean): Observable<any> {

        let endPoint: string;

        this.configService.radioOnOff = onOff;
        const key: string = this.configService.stationKey;

        if (onOff) {
            endPoint = this.radioPlayer + 'listen/' + key;
            console.log('Radio on station ' + key);
        }
        else {
            endPoint = this.radioPlayer  + 'off';
            console.log('Radio switched off');
        }

        // cd $RADIOG_HOME/backend
        // npm run start
        // curl localhost:18300/player | jq

        return this.http.get(endPoint).pipe(
            map((res: any) => {
                this.radioPlaying$.next(onOff);
                console.log('Player response : ' + res);
            }),
            catchError(this.handleError));
    }

    // Take care of possible errors.
    private handleError(error: HttpErrorResponse): void {

        console.log(`Backend error : ${error.message}`);

        return throwError('Cannot get connected to the player');
    }

   // Changes the output volume
    setVolume(value: number): Observable<any> {

        this.configService.volume = value;
        const volume = value.toString();

        const endPoint = this.radioPlayer + 'set?volume=' + volume;

        return this.http.get(endPoint).pipe(
            map((res: any) => {
                console.log('Player response ' + res);
            }),
            catchError(this.handleError));
    }
}
