import { injectable, inject } from 'inversify';
import { commands } from '../static';
import { TYPES } from '../ioc/types';
import { IClient } from '../contracts';

import * as path from 'path';

@injectable()
export class Bog implements ICommand {

    _command = commands.bog // Handled in tfw TODO move here
    _commandRundown = commands.quickrundown

    constructor(
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IContent) private _contentService: IContent,
        @inject(TYPES.IFiles) private _filesService: IFiles
    ) { }

    attach(): void {

        this._client
            .getCommandStream(this._commandRundown)
            .subscribe(imsg => {
                const msg = imsg.Message;
                this.getRundownImage()
                    .then(imagePath => {
                        imsg.send('', { file: imagePath })
                            .then(isSent => {

                                if (!isSent) return;

                                this._contentService.getContent(this._commandRundown)
                                    .then(data => {
                                        msg.channel.send(data);
                                        imsg.done();
                                    });
                            });
                    }).catch(err => console.error(err));
            });
    }

    getRundownImage(): Promise<string> {
        let fullPath = path.join(this._config.images["root"], this._config.images[this._command]);

        let result = this._filesService.getAllFilesWithName(fullPath, new RegExp(this._commandRundown))
            .then(lst => {

                if (lst.length < 0) {
                    console.error("[bog.command.ts] quickrundown file not found");
                    return
                }

                let result = this._config.pathFromRoot(fullPath, lst[0]);
                return result;
            });

        result.catch(err => {
            console.error(err);
        });

        return result;
    }


}