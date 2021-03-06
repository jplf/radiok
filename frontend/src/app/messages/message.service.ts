import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

/**
 * This service displays messages on the web page.
 */
export class MessageService {

    message = 'Wake up smoothly with RadioK !';

    display(message: string): void {
        this.message = message;
    }

    clear(): void {
        this.message = '';
    }
}
