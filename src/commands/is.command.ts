import { IClient } from '../contracts/IClient';
import { inject } from 'inversify';
import { ICommand } from '../contracts/ICommand';
import { injectable } from 'inversify';
import { commands } from "../static/commands";
import { TYPES } from "../ioc/types";

@injectable()
export class IsCommand implements ICommand {

    _commands: string[] = commands.is;
    _regex: RegExp = /(\w+) (.+)/
    _capitals: RegExp = /(?=[A-Z])/

    _chances: string[] = ['- may Allah forgive you for asking this - $verb NOT', 'definitly $verb not', '$verb not', 'probably $verb not',
        'might', '$verb likely to be', '$verb', 'almost definitely 100% $verb'
    ];

    constructor(
        @inject(TYPES.IClient) private _client: IClient
    ) { }


    attach(): void {
        for(let command of this._commands) {
            this._client
                .getCommandStream(command)
                .subscribe(imsg => {
                    const msg = imsg.Message;

                    const match = this._regex.exec(msg.content);
                    if (!match) return;

                    const noun = match[1];
                    const target = match[2];

                    const ending = noun.split(this._capitals).map(e => e.toLowerCase()).join(" ");

                    let chance = this._chances.random().replace("$verb", command);
                    const fullMassage = `${target} ${chance} ${ending}`;

                    msg.channel.sendMessage(fullMassage);
                    imsg.done();
                });
        }
    }
}