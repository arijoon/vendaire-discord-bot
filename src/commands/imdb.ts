import {ICache} from '../contracts/ICache';
import { IDisposable } from 'rx';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";

import * as path from 'path';
import * as imdb from 'imdb-api';

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

                const content = msg.content.trim();
                if (!content) {
                    imsg.done();
                    return;
                }

                let res;
                if (this._cache.has(content)) {
                    res = msg.channel.send(this._cache.getType<string>(content));

                } else {

                    res = imdb.get(content)
                        .then(res => {
                            let response = `Rated **${res.rating}** from *${res.votes}* votes\n${res.imdburl}`;
                            this._cache.set(content, response);

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
}