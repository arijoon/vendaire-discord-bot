import { DiscordMessage } from './../models/discord-message';

export interface IProcessManager {
    process(msg: DiscordMessage);
    start(cluster: any);
}