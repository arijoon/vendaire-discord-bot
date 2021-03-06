import { IDisposable } from 'rx';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

import * as path from 'path';
import { RichEmbed } from 'discord.js';
import { commonRegex } from '../helpers';
import { colors } from '../static';

@injectable()
export class Search implements ICommand {

    _command: string = commands.search;
    _subscription: IDisposable[] = [];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IConfig) private _config: IConfig
    ) { }

    attach(): void {
        this._subscription.push(this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const content = imsg.Content.replace(commonRegex.usermention, '').trim();
                if (!content) {
                    imsg.done();
                    return;
                }

                let url = `https://lmgtfy.com/?q=${encodeURIComponent(content)}&iie=1`;

                let embed = (new RichEmbed())
                    .setTitle('Search')
                    .setColor(colors.AQUA)
                    .setURL(url)
                    .setDescription(`For ${msg.mentions.users.map(u => `<@${u.id}>`).join(', ')}`)
                    .addField('**Asked**', content)
                    .addField('**Result**', url)
                    .setThumbnail('http://www.google.com/images/branding/googlelogo/1x/googlelogo_color_116x41dp.png')

                msg.channel.send('', { embed: embed })
                    .then(m => imsg.done())
                    .catch(err => imsg.done('', true));
            }));
    }
}