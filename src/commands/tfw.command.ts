import { IConfig } from './../contracts/IConfig';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";
import { IFiles } from "../contracts/IFiles";

import * as path from 'path';

@injectable()
export class ThatFeel implements ICommand {

    _command: string = commands.tfw;

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(TYPES.IFiles) private _filesService: IFiles,
    ) { }

    attach(): void {
        this._client
            .getCommandStream(this._command)
            .subscribe(msg => {
                this.selectRandomFile()
                    .then(filename => msg.channel.sendFile(filename));
            });
    }

    selectRandomFile(): Promise<string> {
        let result = this._filesService.getAllFiles(this._config.images)
            .then(lst => {

                let randomFileIndex = Math.floor(Math.random() * lst.length);
                let randomFileName = lst[randomFileIndex];

                let randomFile = path.join(this._config.pathFromRoot(this._config.images), randomFileName);

                return randomFile;
            });

        result.catch(err => {
            console.error(err);
        });

        return result;
    }


}