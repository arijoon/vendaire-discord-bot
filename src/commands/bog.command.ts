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
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IContent) private _contentService: IContent
    ) { }

    attach(): void {
        this._client
            .getCommandStream(this._commandRundown)
            .subscribe(msg => {
                this._contentService.getContent(this._commandRundown)
                    .then(data => msg.channel.sendMessage(data))
                    .catch(err => console.error(err));

            });
    }


}