import { DiscordMessage } from './../models/discord-message';
import { IStartable } from './IStartable';

export interface IProcessManager {
    process(msg: DiscordMessage);
    start(cluster: any);
}