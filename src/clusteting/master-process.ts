import {IMessageUtils} from '../contracts/IMessageUtils';
import { IPermission } from '../contracts/IPermission';
import { inject, injectable } from 'inversify';
import { DiscordMessage } from './../models/discord-message';
import { IProcessManager } from './../contracts/IProcessManager';
import { IConfig } from '../contracts/IConfig';
import { TYPES } from "../ioc/types";
import { swearWords } from "../static/swear-words";
import { TimerQueue } from "../components/timer-queue.com";

import * as util from 'util';
import * as discord from 'discord.js';
import * as os from 'os';

@injectable()
export class Master {

    _client: discord.Client;
    _isAttached: boolean;

    prefix: string;
    lastMsg: DiscordMessage;

    _requstlimit = 2000;
    _userRequests: Set<string> = new Set<string>();

    constructor(
        @inject(TYPES.IProcessManager) private _processManager: IProcessManager,
        @inject(TYPES.IPermission) private _permission: IPermission,
        @inject(TYPES.IMessageUtils) private _msgUtils: IMessageUtils,
        @inject(TYPES.IConfig) private _config: IConfig
    ) {
        this.prefix = _config.app.prefix;
    }

    start(cluster: any) {

        this._isAttached = false;

        this._client = new discord.Client();

        this._client.login(this._config.secret.bot.token);

        this._client.on("ready", () => this.ready());
        
       let queue = new TimerQueue();

       this._client.on("disconnect",
           () => {
               console.log(`[master:${process.pid}] Disconnected, trying to login ...`)
               queue.doTask(
                   () => this._client.login(this._config.secret.bot.token)
                       .then(() => console.log(`[master:${process.pid}] Successfully logged in again`))
                       .catch(err => console.error(`[master:${process.pid}] Failed to login again`, err))
               )
           });

        this._processManager.start(cluster);
    }

    private onDisconnect() {

    }

    private ready() {
        if (this._isAttached) return;

        this._isAttached = true;

        this._client.on("message", (msg) => {

            if (!msg.content.startsWith(this.prefix)) return;

            if (msg.author.bot) return;

            if(!this._permission.isAdmin(msg.author.username) && this.isAtRequestLimit(msg.author.id)) {
                msg.channel.send(`Calm down you ${swearWords.crandom()}`, { reply: '' });
                return;
            }

            if(msg.content !== this.prefix || !this.lastMsg) {
                this.lastMsg = new DiscordMessage(msg.guild.id, msg.id, msg.channel.id);
            } else {
                this._msgUtils.Delete(msg);
            }

            this._processManager.process(this.lastMsg);
        });
    }

    private isAtRequestLimit(username: string): boolean {

        if (this._userRequests.has(username)) return true;

        this._userRequests.add(username);

        setTimeout(() => this._userRequests.delete(username), this._requstlimit);

        return false;
    }
}