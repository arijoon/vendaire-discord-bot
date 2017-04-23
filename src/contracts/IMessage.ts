import { Message } from 'discord.js';

export interface IMessage {

    Message: Message;

    done(): void;
}