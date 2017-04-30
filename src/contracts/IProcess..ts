import { DiscordMessage } from './../models/discord-message';
import { IStartable } from './IStartable';
import { IObservable } from 'rx';

export interface IProcess extends IStartable {
    IsActive: boolean;
    MessagesStream: IObservable<DiscordMessage>;

    ready(): void;
}