import { DiscordMessage } from './../models/discord-message';
import { IObservable } from 'rx';

export interface IProcess extends IStartable {
    IsActive: boolean;
    MessagesStream: IObservable<DiscordMessage>;

    ready(): void;
}