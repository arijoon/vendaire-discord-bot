import { RichEmbed } from 'discord.js';
import { IConfig } from './../contracts/IConfig';
import { ICache } from '../contracts/ICache';
import { IDisposable } from 'rx';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";

import * as rp from 'request-promise';
import * as opt from 'optimist';
import * as querystring from 'querystring';
import * as token from 'google-translate-token';
import { colors } from "../static/colors";
import { langs } from "../static/languages";

@injectable()
export class TranslateCommand implements ICommand {

    _command: string = commands.translate;
    _subscription: IDisposable[] = [];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(TYPES.ICacheString) private _cache: ICache<string, any>
    ) { }

    attach(): void {
        this._subscription.push(this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const fullContent = msg.content.trim();

                let options = this.setupOptions(fullContent.split(' ')).argv
                let content = options._;
                let target = options.l;
                let from = options.f;

                if (!content) {
                    imsg.done('', true);
                    return;
                }

                content = content.join(' ');

                let res;
                if (this._cache.has(fullContent)) {
                    res = msg.channel.send('', this._cache.get(content));

                } else {

                    res = this.translateApi(content, { to: target, from: from} )
                        .then((results) => {
                            let result = `{"data":${results}}`;
                            let fullResult = JSON.parse(result);
                            let translation= fullResult.data[0][0][0];


                            let embed = (new RichEmbed())
                                .setTitle(translation)
                                .setColor(colors.RANDOM)
                                .addField('Original', `*${content}*`)
                                .addField(`In ${langs[target]}`, `*${translation}*`)

                            let res = `** Translation**: ${translation}`;

                            this._cache.set(fullContent, { embed: embed});

                            return msg.channel.send('', { embed: embed });
                        });
                }

                res.then(_ => {
                    imsg.done();
                }).catch(err => {
                    msg.channel.send(` ${content} to ${target} was bad mofo `, { reply: msg });
                    imsg.done(err, true);
                });
            }));
    }

    setupOptions(args: string[]): any {
        var argv = opt(args).options('l', {
            alias: 'lang',
            describe: 'Set the target language',
            default: 'ru'
        }).options('f', {
            alias: 'from',
            describe: 'Set the from language',
            default: 'auto'
        });

        return argv;
    }

    private translateApi(text, opts): Promise<any> {
        opts = opts || {};

        opts.from = opts.from || 'auto';
        opts.to = opts.to || 'en';

        return token.get(text).then(function (token) {
            var url = 'https://translate.google.com/translate_a/single';
            var data = {
                client: 't',
                sl: opts.from,
                tl: opts.to,
                hl: opts.to,
                dt: ['at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't'],
                ie: 'UTF-8',
                oe: 'UTF-8',
                otf: 1,
                ssel: 0,
                tsel: 0,
                kc: 7,
                q: text
            };

            data[token.name] = token.value;

            return url + '?' + querystring.stringify(data);
        }).then(url => rp(url));
    }

}