import {User} from './user';

export class Message {
    constructor(private id: String, private from: User, private content: string) {}
}