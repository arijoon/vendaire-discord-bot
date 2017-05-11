import { IHttp } from './../contracts/IHttpService';
import { IMessage } from '../contracts/IMessage';
import { IDisposable } from 'rx';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from '../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";

import * as _ from 'lodash';
import * as cheerio from 'cheerio';
import { commonRegex } from "../helpers/common-regex";

@injectable()
export class IgImageCommand implements ICommand {

    _command: string = commands.igimage;
    _subscriptions: IDisposable[] = [];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IHttp) private _http: IHttp,
    ) { }

    attach(): void {
        this._subscriptions.push(this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const content = msg.content.trim();

                let link = commonRegex.link.exec(content);

                if(!link || link.length < 1) {
                    msg.channel.send("No link found ...", { reply: msg });
                    imsg.done("No link", true);

                    return;
                }

                this._http.get(link[0])
                    .then((res) => {
                        let a = res;
                        let $ = cheerio.load(res);
                        let img = $('meta[property="og:image"]').attr('content');
                        let desc = $('meta[property="og:description"]').attr('content');

                        return msg.channel.send(desc, { file: img })
                    }).then(() => imsg.done())
                    .catch(err => {
                        imsg.done(err, true);
                    });
            }));
    }


    
}