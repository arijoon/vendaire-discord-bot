import {ICache} from '../contracts/ICache';
import { IDisposable } from 'rx';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";

import * as imdb from 'imdb-api';
import * as opt from 'optimist';

@injectable()
export class ImdbCommand implements ICommand {

    _banCommand: string = commands.imdb;
    _subscription: IDisposable[] = [];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.ICacheString) private _cache: ICache<string, any>
    ) { }

    attach(): void {
        this._subscription.push(this._client
            .getCommandStream(this._banCommand)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const fullContent = msg.content.trim();

                let options = this.setupOptions(fullContent.split(' ')).argv
                let content = options._;
                let year = options.y;

                if (!content) {
                    imsg.done();
                    return;
                }

                content = content.join(' ');

                let res;
                if (this._cache.has(fullContent)) {
                    res = msg.channel.send(this._cache.getType<string>(content));

                } else {

                    let req: any = { name: content };
                    if(year) req.year = year;

                    res = imdb.getReq(req)
                        .then(res => {
                            let response = `Rated **${res.rating}** from *${res.votes}* votes\n${res.imdburl}`;
                            this._cache.set(fullContent, response);

                            return msg.channel.send(response);
                        });
                }

                res.then(_ => {
                    imsg.done();
                }).catch(err => {
                    msg.channel.send(`, ${content} not found mofo`, { reply: msg });
                    imsg.done(err, true);
                });
            }));
    }

    setupOptions(args: string[]): any {
        var argv = opt(args).options('y', {
            alias: 'year',
            describe: 'specify the movie year',
            default: null
        });

        return argv;
    }

}