import { Message, User } from './';

export class ChatMessage extends Message{
    constructor(id: String, from: User, content: string) {
        super(id, from, content);
    }
}