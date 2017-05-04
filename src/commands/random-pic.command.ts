import { IConfig } from './../contracts/IConfig';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";
import { IFiles } from "../contracts/IFiles";

import * as path from 'path';

@injectable()
export class RandomPic implements ICommand {

    _commands: string[] = commands.randomPics;
    _command: string = commands.randomPic;

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(TYPES.IFiles) private _filesService: IFiles,
    ) { }

    attach(): void {
        // Chosen folder
        for (let i = 0; i < this._commands.length; i++) {
            let command = this._commands[i];

            this._client
                .getCommandStream(command)
                .subscribe(imsg => {

                    const msg = imsg.Message;
                    this.selectRandomFile(command)
                        .then(filename => {
                            return msg.channel.send('', { file: filename })
                        }).then(() => imsg.done())
                        .catch(err => imsg.done(err, true));
                });
        }

        // Random folder
        this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                const msg = imsg.Message;
                this.selectRandomFile(this._commands.crandom())
                    .then((filename: string) => {
                        return msg.channel.send('', { file: filename })
                    })
                    .then(() => imsg.done())
                    .catch(err => imsg.done(err, true));
            });
    }

    selectRandomFile(dir: string): Promise<string> {
        let fullPath = path.join(this._config.images["root"], this._config.images[dir]);

        return this._filesService
            .getAllFiles(fullPath)
            .then(lst => {
                return this._config.pathFromRoot(fullPath, lst.crandom());
            });
    }
}