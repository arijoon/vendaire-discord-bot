import { IConfig } from './../contracts/IConfig';
import { ICache } from '../contracts/ICache';
import { IDisposable } from 'rx';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";

import * as Translate from '@google-cloud/translate';
import * as imdb from 'imdb-api';
import * as opt from 'optimist';

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

                if (!content) {
                    imsg.done();
                    return;
                }

                content = content.join(' ');

                let res;
                if (this._cache.has(fullContent)) {
                    res = msg.channel.send(this._cache.getType<string>(content));

                } else {

                    const key = this._config.secret['google-translate'].key;
                    const translate = new Translate({ key: key });

                    res = translate.translate(content, target)
                        .then((results) => {
                            let translations = results[0];
                            translations = Array.isArray(translations) ? translations : [translations];

                            let res = '** Translations**:\n';
                            translations.forEach((translation, i) => {
                                res += `${translation}\n`;
                            });

                            return msg.channel.send(res);
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
            describe: 'Set the language',
            default: 'ru'
        });

        return argv;
    }

}