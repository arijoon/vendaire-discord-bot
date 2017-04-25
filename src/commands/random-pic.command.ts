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

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(TYPES.IFiles) private _filesService: IFiles,
    ) { }

    attach(): void {
        for (let i = 0; i < this._commands.length; i++) {
            let command = this._commands[i];

            this._client
                .getCommandStream(command)
                .subscribe(imsg => {
                    const msg = imsg.Message;
                    this.selectRandomFile(command)
                        .then(filename => {
                            msg.channel.sendFile(filename)
                            .then(() => imsg.done());
                        });
                });
        }
    }

    selectRandomFile(dir: string): Promise<string> {
        let fullPath = path.join(this._config.images["root"], this._config.images[dir]);

        let result = this._filesService
            .getAllFiles(fullPath)
            .then(lst => {

                let randomFileIndex = Math.floor(Math.random() * lst.length);
                let randomFileName = lst[randomFileIndex];

                let randomFile = this._config.pathFromRoot(fullPath, randomFileName);

                return randomFile;
            });

        result.catch(err => {
            console.error(err);
        });

        return result;
    }
}