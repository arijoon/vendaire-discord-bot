import { IDisposable } from 'rx';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

import * as path from 'path';

@injectable()
export class WhichCommand implements ICommand {

    _command: string = commands.which;
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

                const content = imsg.Content;

                new Promise((resolve, reject) => {
                    if (!content) {
                        reject("No content");
                        return;
                    }

                    let options = content.split(' ');
                    resolve(options);

                }).then((options : string[]) => {

                    if(options.length < 2) {
                        return msg.channel.send("Not enough Options");
                    }

                    let result = options.crandom();

                    return msg.channel.send(`**${result}**`);

                }).then(() => {
                    imsg.done();
                }).catch(err => {
                    imsg.done(err, true);
                });
            }));
    }

}