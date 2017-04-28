import { IDisposable } from 'rx';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";
import { MessageCollector } from "discord.js";
import { swearWords } from "../static/swear-words";

import * as path from 'path';
import * as _ from "lodash";

@injectable()
export class BanPhrase implements ICommand {

    _banCommand: string = commands.banphrase;
    _unbanCommand: string = commands.unbanphrase;
    _collectors: MessageCollector[] = [];
    _subscription: IDisposable[] = [];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
    ) { }

    attach(): void {
        this._subscription.push(this._client
            .getCommandStream(this._banCommand)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const content = msg.content.trim();
                if (!content) {
                    imsg.done();
                    return;
                }

                const collector = msg.channel.createCollector(m => !m.author.bot
                    && m.content.includes(content)
                    && !m.content.startsWith(commands.prefix));

                this._collectors.push(collector);

                collector.on('message', m => {
                    m.channel.sendMessage(`yo ${m.author.username}, top saying ${content} you ${swearWords.random()}`);
                });

                collector.on('end', collected => {
                    let authors = new Map<string, number>();
                    let counter = 0;

                    collected.forEach((m, k) => {
                        let u = m.author.username;

                        if (!authors.has(u))
                            authors.set(u, 1);
                        else 
                            authors.set(u, authors.get(u) + 1);
                    });

                    let result = `Stats for ${collected.size} messages with ${content}\n\n`
                    authors.forEach((count, username) => {
                        result += `\t${username}: said it ${count} times\n`
                    });

                    msg.channel.sendCode('md', result);
                });

                imsg.done();
            }));

        this._subscription.push(this._client
            .getCommandStream(this._unbanCommand)
            .subscribe(imsg => {
                this._collectors.forEach((v, i) => v.stop());
                imsg.done();
            }));
    }
}