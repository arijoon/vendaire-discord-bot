import { IDisposable } from 'rx';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { MessageCollector } from 'discord.js';
import { swearWords } from '../static';

import * as path from 'path';

@injectable()
export class BanPhrase implements ICommand {

    _banCommand: string = commands.banphrase;
    _unbanCommand: string = commands.unbanphrase;
    _collectors: MessageCollector[] = [];
    _subscription: IDisposable[] = [];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IConfig) private _config: IConfig
    ) { }

    attach(): void {
        this._subscription.push(this._client
            .getCommandStream(this._banCommand)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const content = imsg.Content;
                if (!content) {
                    imsg.done();
                    return;
                }

                const collector = msg.channel.createMessageCollector({ filter: m => !m.author.bot
                    && m.content.includes(content)
                    && !m.content.startsWith(this._config.app.prefix)});

                this._collectors.push(collector);

                collector.on('collect', m => {
                    m.channel.send({ content: `yo, stop saying ${content} you ${swearWords.crandom()}`, reply: { messageReference: m } });
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

                    imsg.send(result, { code: '' });
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