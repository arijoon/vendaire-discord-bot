import { IFiles } from '../contracts/IFiles';
import { IClient } from '../contracts/IClient';
import { inject } from 'inversify';
import { ICommand } from '../contracts/ICommand';
import { injectable } from 'inversify';
import { commands } from "../static/commands";
import { TYPES } from "../ioc/types";
import { commonRegex } from "../helpers/common-regex";
import { IConfig } from "../contracts/IConfig";

import * as path from 'path';

@injectable()
export class RateCommand implements ICommand {

    readonly _command: string = commands.rate;

    readonly _chances = {
        1: "would not touch with a stick",
        2: "would not touch",
        9: "would like to decimate",
        10: "would absolutely decimate uncontrollably"
    };
    
    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(TYPES.IFiles) private _filesService: IFiles
    ) { }

    attach(): void {
        this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                const msg = imsg.Message;

                let roll = this.getRoll(3);

                let result: string;

                if(commonRegex.link.test(msg.content.trim())) {
                    result = `${msg.content}\nThis is ${roll}/10 `
                } else {
                    result = `${msg.content} is ${roll}/10 `
                }

                if (this._chances[roll])
                    result += this._chances[roll]

                msg.channel.sendMessage(result)
                    .then(() => imsg.done());

                if (roll > 8) {
                    const dirPath = path.join(this._config.images["root"], this._config.images['fap']);

                    this._filesService.getRandomFile(dirPath)
                        .then(file => {

                            const filePath = this._config.pathFromRoot(dirPath, file);
                            msg.channel.sendFile(filePath)
                        });
                }
            });
    }

    getRoll(tries: number): number {
        let highest = 0;
        for(let i = 0; i < tries; i++) {
            let roll = Math.floor(Math.random()*10);

            if(roll > highest) highest = roll
        }

        return highest;
    }
}