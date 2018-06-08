import { IClient } from './../contracts';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { inject, injectable } from 'inversify';
import { IDisposable } from 'rx';


@injectable()
export class SpaceOutCommand implements ICommand {

    _command: string = commands.spaceout;
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
                    .toUpperCase()
                    .split('');

                let result = spacedOut.join(' ').trim();

                for(let c of spacedOut) {
                    if(!c || c == ' ' || c == spacedOut[0]) continue;
                    result += `\n${c}`;
                }

                msg.channel.send(result)
                .then(() => imsg.done());
            });
    }

    public detach(): void {
        this._subscription.dispose();
    }
}