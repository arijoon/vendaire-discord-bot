import { inject, injectable } from 'inversify';
import { DiscordMessage } from './../models/discord-message';
import { IProcessManager } from './../contracts/IProcessManager';
import { IConfig } from '../contracts/IConfig';
import { TYPES } from "../ioc/types";
import { swearWords } from "../static/swear-words";
import * as util from 'util';
import * as discord from 'discord.js';
import * as os from 'os';

@injectable()
export class Master {

    _client: discord.Client;
    _isAttached: boolean;

    prefix: string;

    _requstlimit = 2000;
    _userRequests: Set<string> = new Set<string>();

    constructor(
        @inject(TYPES.IProcessManager) private _processManager: IProcessManager,
        @inject(TYPES.IConfig) private _config: IConfig
    ) {
        this.prefix = _config.app.prefix;
    }

    start(cluster: any) {

        this._isAttached = false;

        this._client = new discord.Client();

        this._client.login(this._config.secret.bot.token);

        this._client.on("ready", () => this.ready());

        this._processManager.start(cluster);
    }

    private ready() {
        if (this._isAttached) return;

        this._isAttached = true;

        this._client.on("message", (msg) => {

            if (!msg.content.startsWith(this.prefix)) return;

            if (msg.author.bot) return;

            if (this.isAtRequestLimit(msg.author.id)) {
                msg.channel.send(`Calm down you ${swearWords.random()}`, { reply: '' });
                return;
            }

            this._processManager.process(new DiscordMessage(msg.guild.id, msg.id, msg.channel.id));

        });
    }

    private isAtRequestLimit(username: string): boolean {

        if (this._userRequests.has(username)) return true;

        this._userRequests.add(username);

        setTimeout(() => this._userRequests.delete(username), this._requstlimit);

        return false;
    }
}