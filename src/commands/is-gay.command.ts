import {IClient} from '../contracts/IClient';
import { inject } from 'inversify';
import {ICommand} from '../contracts/ICommand';
import { injectable } from 'inversify';
import { commands } from "../static/commands";
import { TYPES } from "../ioc/types";

@injectable()
export class IsGayCommand implements ICommand {

    _command: string = commands.isGay;

    _chances: string[] = [ 'is Not', 'is probably not', 'might not be', 'might be', 'is', 'is almost definitely 100%'];

    constructor(
        @inject(TYPES.IClient) private _client: IClient
    ) { }


    attach(): void {
        this._client
            .getCommandStream(this._command)
            .subscribe(msg => {
                msg.channel.sendMessage(this.getComposedResult(msg.content));
            });
    }

    getComposedResult(message: string) {
        let pos = message.indexOf(this._command) + this._command.length;
        let name = message.substr(pos);

        let r = Math.floor(Math.random()*this._chances.length);

        let chanceResult = this._chances[r];

        let fullResult = `${name} ${chanceResult} gay`;

        return fullResult;
    }
}