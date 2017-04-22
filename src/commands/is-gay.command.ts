import { IClient } from '../contracts/IClient';
import { inject } from 'inversify';
import { ICommand } from '../contracts/ICommand';
import { injectable } from 'inversify';
import { commands } from "../static/commands";
import { TYPES } from "../ioc/types";

@injectable()
export class IsGayCommand implements ICommand {

    _command: string = commands.isGay;

    _chances: string[] = ['is -- may Allah forgive you for asking this -- NOT', 'is definitly not', 'is not', 'is probably not',
        'might be', 'is likley to be', 'is', 'is almost definitely 100%'
    ];

    constructor(
        @inject(TYPES.IClient) private _client: IClient
    ) { }


    attach(): void {
        this._client
            .getCommandStream(this._command)
            .subscribe(msg => {
                const fullMassage = `${msg.content} ${this._chances.random()} gay`;

                msg.channel.sendMessage(fullMassage);
            });
    }
}