import { IMessage } from '../../contracts/IMessage';
import { IDisposable } from 'rx';
import { IClient } from '../../contracts/IClient';
import { inject } from 'inversify';
import { ICommand } from '../../contracts/ICommand';
import { TYPES } from "../../ioc/types";
import { commands } from "../../static/commands";

export class ImGray implements ICommand {

    _command: string = commands.image.gray;
    _subscriptions: IDisposable[] = [];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
    ) { }


    attach(): void {
        this._subscriptions.push(this._client
            .getCommandStream(this._command)
            .subscribe(msg => {
                this.process(msg);
            }));
    }

    private process(imsg: IMessage) {
        
    }


}