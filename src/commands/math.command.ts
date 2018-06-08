import { IClient } from '../contracts';
import { inject } from 'inversify';
import { injectable } from 'inversify';
import { commands } from '../static';
import { TYPES } from '../ioc/types';

// import { math } from 'math.js';
import * as math from 'mathjs';

@injectable()
export class MathCommand implements ICommand {

    readonly _command: string = commands.math;

    constructor(
        @inject(TYPES.IClient) private _client: IClient
    ) { }

    attach(): void {
        this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                const msg = imsg.Message;

                let result: string;
                try {
                    result = math.eval(msg.content);
                } catch(ex) {
                    result = `${msg.content} is not a valid mathematical expression`;
                }

                msg.channel.send(result)
                .then(() => imsg.done());
            });
    }
}