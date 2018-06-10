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

    /**
     * Send a message to a specified channel
     * @param guildId Id of the guild
     * @param channel Id of the channel 
     * @param content content of the message
     * @param options discord options to send with the message
     */
    sendMessage(guildId: string, channelId: string, content: string, options?: any): Promise<any>
}