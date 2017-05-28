import { IConfig } from '../contracts/IConfig';
import { IDisposable } from 'rx';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";

import * as path from 'path';

@injectable()
export class FlipCommand implements ICommand {

    _command: string = commands.flip;
    _subscription: IDisposable[] = [];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IConfig) private _config: IConfig
    ) { }

    attach(): void {
        this._subscription.push(this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const content = msg.content.trim();

                new Promise((resolve, reject) => {
                    let result = "HEADS";

                    if(Math.random() > 0.5) {
                        result = "TAILS"
                    }
                    
                    msg.channel.send(`**${result}**`);
                    resolve();

                }).then(() => {
                    imsg.done();
                }).catch(err => {
                    imsg.done(err, true);
                });
            }));
    }

}