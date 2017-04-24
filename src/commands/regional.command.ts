import { IClient } from './../contracts/IClient';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";
import { inject, injectable } from "inversify";
import { IDisposable } from "rx";


@injectable()
export class RegionalCommand implements ICommand {

    _command: string = commands.regional;
    _subscription: IDisposable;

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
    ) { }

    public attach(): void {
        this._subscription = this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                const msg = imsg.Message;

                const spacedOut = msg.content
                    .trim()
                    .toLowerCase()
                    .split('')
                    .map(a => {
                        if (a == ' ') return a;
                        return `:regional_indicator_${a}:`
                    });

                let result = "";

                for(let c of spacedOut) {
                    result += `${c}`;
                }

                // Add horizontal column
                // for(let c of spacedOut) {
                //     if(!c || c == spacedOut[0] || c == ' ' || c == '\n') continue
                //     result += `\n${c}`
                // }

                msg.channel.sendMessage(result)
                .then(() => imsg.done());
            });
    }

    public detach(): void {
        this._subscription.dispose();
    }
}