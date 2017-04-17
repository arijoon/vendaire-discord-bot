import { Observable, Subject, ISubject, IObservable } from "rx";
import { injectable } from "inversify";
import { IClient } from './contracts/IClient';
import * as discord from 'discord.js' ;

declare let require: any;

let config = require('./config.secret.json');

@injectable()
export class Client implements IClient {

    prefix: string = "!";
    _client: discord.Client;

    _mappings: Map<string, ISubject<any>>;

    constructor() {

       this._client = new discord.Client();

       this._mappings = new Map<string, Subject<any>>();

       this._client.login(config.bot.token);

       this._client.on("ready", () => this.attachListener())
    }

    public getCommandStream(command: string): IObservable<any> {

        if(!this._mappings.has(command)) {
            this._mappings.set(command, new Subject<any>());
        }

        return this._mappings.get(command);
    }

    private attachListener() {
        this._client.on("message", (msg) => {


            if (!msg.content.startsWith(this.prefix)) return;

            if (msg.author.bot) return;

            this._mappings.forEach((subject, command) => {

                if(msg.content.startsWith(this.prefix + command)) {
                    console.log("[+] Received command: ", command);
                    subject.onNext(msg);
                }
            });

        });
    }

}

