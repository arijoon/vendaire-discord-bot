import { IMessage } from '../contracts/IMessage';
import { IDisposable } from 'rx';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";
import { Message } from "discord.js";

import * as opt from 'optimist';
import * as _ from 'lodash';

@injectable()
export class UrbanDicCommand implements ICommand {

    _command: string = commands.urban;
    _subscriptions: IDisposable[] = [];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IPermission) private _permission: IPermission,
        @inject(TYPES.IHttp) private _httpClient: IHttp,
    ) { }

    attach(): void {
        this._subscriptions.push(this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const content = msg.content.trim();

                // TODO add options to show tags and stuff
                // let argv = this.setupOptions(content.split(' '));
                // let ops = argv.argv

                let thumbsUp = ':thumbsup:';
                let thumbsDown = ':thumbsdown:';
                let maxLength = 5;

                this._httpClient.getJson(`http://api.urbandictionary.com/v0/define?term=${encodeURIComponent(content)}`)
                    .then(res => {
                        if (!res.list || res.list.length < 1) {
                            return msg.channel.send(`No result found for ${content}, search again dumbass`, { reply: msg });
                        }

                        let result = [];

                        for (let item of res.list) {
                            if(result.length >= maxLength) break;

                            result.push(`**${item.word}**: ${item.definition}\n${thumbsUp} ${item.thumbs_up}, ${thumbsDown} ${item.thumbs_down}, by *${item.author}*`);
                        }

                        return msg.channel.send(result.join('\n\n'), { split: true });

                    }).then(res => {
                        imsg.done();
                    }).catch(err => {
                        imsg.done(err, true);
                    });
            }));
    }
    
    setupOptions(args: string[]): any {
        var argv = opt(args)
        .options('b', {
            alias: 'board',
            describe: 'specify the board',
            default: 'b'
        }).options('h', {
            alias: 'help',
            describe: 'show this message',
            default: false
        }).options('i', {
            alias: 'image',
            describe: 'choose a random image from board',
            default: true
        }).options('q', {
            alias: 'query',
            describe: 'pass a query to search',
            default: null
        }).options('s', {
            alias: 'subject',
            describe: 'pass a subject query to search in subject only',
            default: null
        }).options('d', {
            alias: 'delete',
            describe: 'delete last posted image',
            default: false
        });

        return argv;
    }

}