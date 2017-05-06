import { ITimer } from './ITimer';
import { Message } from 'discord.js';

export interface IMessage {

    Message: Message;
    Timer: ITimer;

    done(msg?: string, err?: any): void;
}