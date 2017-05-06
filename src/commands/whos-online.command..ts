import { IDisposable } from 'rx';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";

import * as path from 'path';
import * as Table from 'cli-table';

@injectable()
export class WhosOnline implements ICommand {

    get _statuses(): string[] { return [ 'joke', ' leaf', 'waste of space', 'god amongst men', 'a legend', 'a wanker', 'jerking off non stop',
        'face looks more like a dick than a face', 'is a true homo', 'true Aryan', 'masterrace', 'not a masterrace', 'subhuman']; 
    }

    _command: string = commands.whosonline;
    _subscription: IDisposable;

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
    ) { }

    attach(): void {
        this._subscription = this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                const msg = imsg.Message;

                if (!msg.guild) {
                    imsg.done();
                    return;
                }

                const presences = msg.guild.presences;
                const members = msg.guild.members;

                let result = "These people are here now with their status: \n\n"

                let statuses = this._statuses;
                let table = new Table({
                    head: [ '* Username *' , '* Status *']
                });

                presences.forEach((val, key) => {
                    let member = members.get(key);

                    if(member.user.bot) return;

                    if(statuses.length < 1) statuses = this._statuses;

                    table.push([member.user.username, statuses.popRandom()])
                });

                result += table.toString();

                msg.channel.send(result, { code: '' })
                    .then(() => imsg.done())
                    .catch(err => {
                        console.error(err);
                        imsg.done(err, true);
                    });
            });
    }

}