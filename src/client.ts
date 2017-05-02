import * as util from 'util';
import { TextChannel } from 'discord.js';
import { IProcess } from './contracts/IProcess.';
import { Timer } from './helpers/timer.helper';
import { MessageWrapper } from './models/message-wrapper.model';
import { IConfig } from './contracts/IConfig';
import { Message } from 'discord.js';
import { Observable, Subject, ISubject, IObservable } from "rx";
import { injectable, inject, optional } from "inversify";
import { IClient } from './contracts/IClient';
import { commands } from "./static/commands";
import { swearWords } from "./static/swear-words";

import * as discord from 'discord.js';
import { TYPES } from "./ioc/types";
import { IMessage } from "./contracts/IMessage";

declare let require: any;

@injectable()
export class Client implements IClient {

    prefix: string; 
    _client: discord.Client;
    _isAttached: boolean;

    _mappings: Map<string, ISubject<IMessage>>;

    _requstlimit = 2000;
    _userRequests: Set<string> ;

    constructor(
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(TYPES.IProcess) @optional() private _process: IProcess
    ) {
       this._isAttached = false;

       this.prefix = _config.app.prefix;

       this._client = new discord.Client();

       this._mappings = new Map<string, ISubject<IMessage>>();

       this._userRequests = new Set<string>();

       this._client.login(this._config.secret.bot.token);

       this._client.on("ready", () => this.attachListener())
    }

    public getCommandStream(command: string): IObservable<IMessage> {

        if(!this._mappings.has(command)) {
            this._mappings.set(command, new Subject<IMessage>());
        }

        return this._mappings.get(command);
    }

    public getClient(): discord.Client {
        return this._client;
    }

    private attachListener() {

        if (this._isAttached) return;

        this._isAttached = true;

        if(this._process && this._process.IsActive) {
            this.listenToProcessManager();
        } else {
            this.listenToDiscord();
        }
    }

    private listenToProcessManager() {
        this._process.MessagesStream.subscribe(dmsg => {
            let channel = this._client.guilds
                .get(dmsg.GuildId).channels
                .get(dmsg.ChannelId) as TextChannel;

            if(channel)
                channel.fetchMessage(dmsg.MessageId)
                    .then((msg) => this.processMessage(msg))
                    .catch(err => {
                        console.error(`[!client.ts:${process.pid}] Could not find message by id ${dmsg.MessageId}`, err);
                    });
            else 
                console.error(`[!client.ts:${process.pid}] Unable to fetch channel `, util.inspect(dmsg), util.inspect(this._client.guilds));
        });

        this._process.ready();
    }

    private listenToDiscord() {
        this._client.on("message", (msg) => {

            if (!msg.content.startsWith(this.prefix)) return;

            if (msg.author.bot) return;

            if(this.isAtRequestLimit(msg.author.id)) {
                msg.channel.send(`Calm down you ${swearWords.random()}`, { reply: msg });
                return;
            }

            this.processMessage(msg);
        });

    }

    private processMessage(msg: Message) {
        let foundCommand: boolean = false;

        this._mappings.forEach((subject, command) => {

            if (foundCommand) return;

            const fullCommand = this.prefix + command;

            if (msg.content.toLowerCase().startsWith(fullCommand)) {

                foundCommand = true;

                console.log(`[client.ts:${process.pid}]: Received command: ${command}`);

                msg.content = msg.content.substring(fullCommand.length);

                const message = this.buildMessageWrapper(msg, command);

                subject.onNext(message);

                return true;
            }
        });

        if(!foundCommand) this.sendReadySignal();
    }

    private buildMessageWrapper(msg: Message, command: string): IMessage {
        const timer = new Timer().start();
        msg.channel.startTyping();

        setTimeout(() => { // Force terminate typing after 30 secs
            if(msg.channel.typing) msg.channel.stopTyping();
        }, 10000);

        const onDone = (cmsg?: string, err?: any) => {
            const elapsed = timer.stop();

            if(err)
                console.error(`[client.ts:${process.pid}]: Processed command: ${command} in ${elapsed/1000} seconds ${cmsg}`);
            else
                console.log(`[client.ts:${process.pid}]: Processed command: ${command} in ${elapsed/1000} seconds ${cmsg}`);

            msg.channel.stopTyping(true);

            this.sendReadySignal();
        }

        const wrapper = new MessageWrapper(onDone, msg);

        return wrapper;
    }

    private isAtRequestLimit(username: string): boolean {

        if(this._userRequests.has(username)) return true;

        this._userRequests.add(username);

        setTimeout(() => this._userRequests.delete(username), this._requstlimit);

        return false;
    }

    private sendReadySignal() {
        if(this._process && this._process.IsActive)
            this._process.ready();
    }

}

