import { injectable, inject } from 'inversify';
import { commands } from '../static';
import { TYPES } from '../ioc/types';
import { IClient } from '../contracts';
import { commonRegex } from '../helpers';

import * as path from 'path';
import * as cheerio from 'cheerio';

@injectable()
export class MyAnimeListCommand implements ICommand {

    _command = commands.myanimelist 

    constructor(
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(TYPES.IHttp) private _http: IHttp,
        @inject(TYPES.IClient) private _client: IClient
    ) { }

    attach(): void {

        this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                const msg = imsg.Message;

                let result = commonRegex.link.exec(imsg.Content);

                if(result.length < 1) {
                    imsg.done();
                    return;
                } 

                this._http.get(result[0]).then(res => {
                    const $ = cheerio.load(res);
                    let titles;
                    titles = $('.animetitle span');

                    let result = "***************************\n";
                        result+= `Your List: ${titles.length}\n`
                        result+= "***************************\n";

                    titles.each((index, el) => {
                        let title = $(el).text();
                        result += `\n${title}`
                    });

                    return imsg.send(result, { split: true })
                }).then(_ => imsg.done())
                .catch(err => {
                    imsg.done(err, true);
                });
            });
    }

    

}