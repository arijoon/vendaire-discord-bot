import { Message } from 'discord.js';

export interface IMessage {

    Message: Message;
    Timer: ITimer;

    done(msg?: string, err?: any): void;

    /** Send a message to the same channel */
    send(content?: string, options?: any): Promise<Message | Message[]>;
}