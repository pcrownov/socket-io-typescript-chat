import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Message } from '../model/message';
import { Event } from '../model/event';
import { Select } from '../model/select';

import * as socketIo from 'socket.io-client';

const SERVER_URL = 'http://localhost:8085';

@Injectable()
export class SocketService {
    private socket;

    public initSocket(): void {
        this.socket = socketIo(SERVER_URL);
    }

    public send(message: Message): void {
        this.socket.emit('message', message);
    }

    public onMessage(): Observable<Message> {
        return new Observable<Message>(observer => {
            this.socket.on('message', (data: Message) => observer.next(data));
        });
    }

    public onLive(): Observable<boolean> {
      return new Observable<boolean>(observer => {
        this.socket.on('live', (data:boolean) => observer.next(data));
      })
    }

    public onSelect(): Observable<Select> {
        return new Observable<Select>( observer => {
            this.socket.on('select', (data: Select) => observer.next(data));
        });
    }

    public onNode(): Observable<Object> {
        return new Observable<Object>( observer => {
            this.socket.on('node', (data: Object) => observer.next(data));
        });
    }

    public onEvent(event: Event): Observable<any> {
        return new Observable<Event>(observer => {
            this.socket.on(event, () => observer.next());
        });
    }
}
