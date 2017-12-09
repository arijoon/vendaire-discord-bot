import { IConfig } from '../contracts/IConfig';
import { IDisposable } from 'rx';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";
import { MessageCollector } from "discord.js";
import { swearWords } from "../static/swear-words";

import * as path from 'path';

@injectable()
export class RollCommand implements ICommand {

    _command: string = commands.roll;
    _subscriptions: IDisposable[] = [];

    _reg = /(\d)?d(\d+)/g

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IConfig) private _config: IConfig
    ) { }

    attach(): void {
        this._subscriptions.push(this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const content = msg.content.trim();
                if (!content) {
                    imsg.done();
                    return;
                }

                (new Promise((resolve, reject) => {

                    let result = [];

                    let match = this._reg.exec(content);

                    if (!match) {
                        resolve(msg.channel.send("Bad format mofo", { reply: msg }));
                    }

                    while(match != null) {

                        let num = parseInt(match[1]) || 1;
                        let die = parseInt(match[2]);

                        let res = `Rolling ${num} x d${die}:`
                        for(let i = 0; i < num; i++) {
                            res += ` |${this.roll(die)}|`;
                        }

                        result.push(res);

                        match = this._reg.exec(content);
                    }

                    resolve(msg.channel.send(result.join('\n'), { code: 'md' }));

                })).then(res => {
                    imsg.done();
                }).catch(err => {
                    imsg.done(err, true);
                });

                
            }));
    }

    private roll(die: number) {
        let result = Math.floor(Math.random() * die);

        return result;
    }

}