import { IClient } from './../contracts';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { inject, injectable } from 'inversify';
import { IDisposable } from 'rx';


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

                const spacedOut = imsg.Content
                    .trim()
                    .toLowerCase()
                    .split('')
                    .map(a => {
                        if (!a || a == ' ' || a == '\n' || a == '\r') return a;
                        return `:regional_indicator_${a}:`
                    });

                let result = "";

                for (let c of spacedOut) {
                    result += `${c}`;
                }

                msg.channel.send(result)
                    .then(() => imsg.done());
            });
    }

    public detach(): void {
        this._subscription.dispose();
    }
}