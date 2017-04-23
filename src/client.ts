import { Timer } from './helpers/timer.helper';
import { MessageWrapper } from './models/message-wrapper.model';
import { IConfig } from './contracts/IConfig';
import { Message } from 'discord.js';
import { Observable, Subject, ISubject, IObservable } from "rx";
import { injectable, inject } from "inversify";
import { IClient } from './contracts/IClient';
import { commands } from "./static/commands";
import { swearWords } from "./static/swear-words";

import * as discord from 'discord.js';
import { TYPES } from "./ioc/types";
import { IMessage } from "./contracts/IMessage";

declare let require: any;

@injectable()
export class Client implements IClient {

    prefix: string = commands.prefix;
    _client: discord.Client;
    _isAttached: boolean;

    _mappings: Map<string, ISubject<IMessage>>;

    _requstlimit = 2000;
    _userRequests: Set<string> ;

    constructor(
        @inject(TYPES.IConfig) private _config: IConfig
    ) {
       this._isAttached = false;

       this._client = new discord.Client();

       this._mappings = new Map<string, ISubject<IMessage>>();

       this._userRequests = new Set<string>();

       this._client.login(this._config.config.bot.token);

       this._client.on("ready", () => this.attachListener())

    //    setInterval(() => this._userRequests.clear(), 60000);
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

        if(this._isAttached) return;

        this._isAttached = true;

        this._client.on("message", (msg) => {

            if (!msg.content.startsWith(this.prefix)) return;

            if (msg.author.bot) return;

            if(this.isAtRequestLimit(msg.author.id)) {
                msg.channel.sendMessage(`Calm down ${msg.author.username}, you ${swearWords.random()}`);
                return;
            }

            let foundCommand: boolean = false;

            this._mappings.forEach((subject, command) => {

                if(foundCommand) return;

                const fullCommand = this.prefix + command;

                if(msg.content.toLowerCase().startsWith(fullCommand)) {

                    foundCommand = true;

                    console.log("[client.ts]: Received command:", command);

                    msg.content = msg.content.substring(fullCommand.length);

                    const message = this.buildMessageWrapper(msg, command);

                    subject.onNext(message);

                    return true;
                }
            });

        });
    }

    private buildMessageWrapper(msg: Message, command: string): IMessage {
        const timer = new Timer().start();

        const onDone = () => {
            const elapsed = timer.stop();
            console.log('[client.ts]: Processed command:', command, 'in ', elapsed/1000, 'seconds');
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

}

