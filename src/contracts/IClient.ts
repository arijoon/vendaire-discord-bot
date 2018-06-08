import { IMessage } from './IMessage';
import { Client, Message } from 'discord.js';
import { IObservable } from 'rx';

export interface IClient {
    getCommandStream(command: string): IObservable<IMessage>

    /**
     * Do not call done method on this channel
     */
    getGlobalCommandStream(): IObservable<IMessage>
    getClient(): Client;

    attachHelp(helps: IHelp[])
    processDiscordMessage(msg: Message);
}