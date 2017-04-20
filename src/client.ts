import { Message } from 'discord.js';
import { Observable, Subject, ISubject, IObservable } from "rx";
import { injectable } from "inversify";
import { IClient } from './contracts/IClient';
import { commands } from "./static/commands";
import * as discord from 'discord.js';

declare let require: any;

let config = require('./config.secret.json');

@injectable()
export class Client implements IClient {

    prefix: string = commands.prefix;
    _client: discord.Client;

    _mappings: Map<string, ISubject<Message>>;

    constructor() {
       this._client = new discord.Client();

       this._mappings = new Map<string, ISubject<Message>>();

       this._client.login(config.bot.token);

       this._client.on("ready", () => this.attachListener())
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
        this._client.on("message", (msg) => {

            if (!msg.content.startsWith(this.prefix)) return;

            if (msg.author.bot) return;

            this._mappings.forEach((subject, command) => {

                if(msg.content.toLowerCase().startsWith(this.prefix + command)) {

                    console.log("[client.ts]: Received command:", command);

                    subject.onNext(msg);

                    return true; // Only handle one command
                }
            });

        });
    }

}

