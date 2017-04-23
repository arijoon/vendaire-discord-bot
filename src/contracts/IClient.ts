import { IMessage } from './IMessage';
import { Message } from 'discord.js';
import { Client } from 'discord.js';
import { IObservable } from 'rx';

export interface IClient {
    getCommandStream(command: string): IObservable<IMessage>
    getClient(): Client;
}