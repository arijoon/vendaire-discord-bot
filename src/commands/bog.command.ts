import { IConfig } from './../contracts/IConfig';
import { IFiles } from './../contracts/IFiles';
import { injectable, inject } from 'inversify';
import { ICommand } from './../contracts/ICommand';
import { commands } from "../static/commands";
import { TYPES } from "../ioc/types";
import { IClient } from "../contracts/IClient";
import { IContent } from "../contracts/IContent";

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
            .subscribe(msg => {
                this.getRundownImage()
                    .then(imagePath => {
                        msg.channel.sendFile(imagePath)
                            .then(isSent => {

                                if (!isSent) return;

                                this._contentService.getContent(this._commandRundown)
                                    .then(data => {
                                        msg.channel.sendMessage(data)
                                    });
                            });
                    }).catch(err => console.error(err));
            });
    }

    getRundownImage(): Promise<string> {
        let result = this._filesService.getAllFilesWithName(this._config.images[this._command], new RegExp(this._commandRundown))
            .then(lst => {

                if (lst.length < 0) {
                    console.error("[bog.command.ts] quickrundown file not found");
                    return
                }

                let result = this._config.pathFromRoot(this._config.images[this._command], lst[0]);
                return result;
            });

        result.catch(err => {
            console.error(err);
        });

        return result;
    }


}