import { IClient } from '../contracts/IClient';
import { inject } from 'inversify';
import { ICommand } from '../contracts/ICommand';
import { injectable } from 'inversify';
import { commands } from "../static/commands";
import { TYPES } from "../ioc/types";

@injectable()
export class IsCommand implements ICommand {

    _command: string = commands.is;
    _regex: RegExp = /(\w+) (.+)/
    _capitals: RegExp = /(?=[A-Z])/

    _chances: string[] = ['is - may Allah forgive you for asking this - NOT', 'is definitly not', 'is not', 'is probably not',
        'might be', 'is likely to be', 'is', 'is almost definitely 100%'
    ];

    constructor(
        @inject(TYPES.IClient) private _client: IClient
    ) { }


    attach(): void {
        this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                const msg = imsg.Message;

                const match = this._regex.exec(msg.content);
                if(!match) return;

                const noun = match[1];
                const target = match[2];

                const ending = noun.split(this._capitals).map(e => e.toLowerCase()).join(" ");

                const fullMassage = `${target} ${this._chances.random()} ${ending}`;

                msg.channel.sendMessage(fullMassage);
                imsg.done();
            });
    }
}