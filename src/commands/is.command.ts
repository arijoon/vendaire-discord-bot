import { IClient } from '../contracts/IClient';
import { inject } from 'inversify';
import { ICommand } from '../contracts/ICommand';
import { injectable } from 'inversify';
import { commands } from "../static/commands";
import { TYPES } from "../ioc/types";

@injectable()
export class IsCommand implements ICommand {

    readonly _commands: string[] = commands.is;
    readonly _regex: RegExp = /(\w+) (.+)/
    readonly _capitals: RegExp = /(?=[A-Z])/

    readonly _chances: string[] = ['- may Allah forgive you for asking this - $verb NOT', 'definitly $verb not', '$verb not', 'probably $verb not',
        '$verb likely to be', '$verb', '$verb almost definitely 100%'
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

                    let chance = this._chances.crandom().replace("$verb", command);
                    const fullMassage = `${target} ${chance} ${ending}`;

                    msg.channel.send(fullMassage)
                        .then(_ => imsg.done())
                        .catch(err => imsg.done(err, true));
                });
        }
    }
}