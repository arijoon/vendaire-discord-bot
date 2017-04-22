import { Message } from 'discord.js';
import { Observable, Subject, ISubject, IObservable } from "rx";
import { injectable } from "inversify";
import { IClient } from './contracts/IClient';
import { commands } from "./static/commands";
import * as discord from 'discord.js';
import { swearWords } from "./static/swear-words";

declare let require: any;

let config = require('./config.secret.json');

@injectable()
export class Client implements IClient {

    prefix: string = commands.prefix;
    _client: discord.Client;
    _isAttached: boolean;

    _mappings: Map<string, ISubject<Message>>;

    _requstlimit = 1000;
    _userRequests: Set<string> ;

    constructor() {
       this._isAttached = false;

       this._client = new discord.Client();

       this._mappings = new Map<string, ISubject<Message>>();

       this._userRequests = new Set<string>();

       this._client.login(config.bot.token);

       this._client.on("ready", () => this.attachListener())

    //    setInterval(() => this._userRequests.clear(), 60000);
    }

    public getCommandStream(command: string): IObservable<Message> {

        if(!this._mappings.has(command)) {
            this._mappings.set(command, new Subject<Message>());
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

                if(msg.content.toLowerCase().startsWith(this.prefix + command)) {

                    foundCommand = true;

                    console.log("[client.ts]: Received command:", command);

                    subject.onNext(msg);

                    return true;
                }
            });

        });
    }

    private isAtRequestLimit(username: string): boolean {

        if(this._userRequests.has(username)) return true;

        this._userRequests.add(username);

        setTimeout(() => this._userRequests.delete(username), this._requstlimit);

        return false;
    }

}

