import { IClient } from './../contracts/IClient';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";
import { inject, injectable } from "inversify";

@injectable()
export class SayHello implements ICommand {

    command: string  = commands.sayHello;

    constructor(
        @inject(TYPES.IClient) private _client: IClient
    ) { }

    attach(): void {
        this._client
        .getCommandStream(this.command)
        .subscribe(msg => {
            msg.channel.sendMessage("Hi man!");
        });
    }
}