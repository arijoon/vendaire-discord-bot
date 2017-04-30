import { IClient } from '../contracts/IClient';
import { IConfig } from '../contracts/IConfig';
import { inject } from 'inversify';
import { ICommand } from '../contracts/ICommand';
import { injectable } from 'inversify';
import { commands } from "../static/commands";
import { TYPES } from "../ioc/types";
import { Message } from "discord.js";

import * as Youtube from 'youtube-node';

@injectable()
export class YoutubeSearch implements ICommand {

    _yt: any;
    _command = commands.yt;

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IConfig) private _config: IConfig
    ){
        this._yt = new Youtube();
        this._yt.setKey(_config.secret.youtube.key)
    }

    attach(): void {
        this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                const msg = imsg.Message;

                let q = this.getSearchQuery(msg.content);

                this.search(q, msg)
                    .then(res => {
                        msg.channel.sendMessage(res);
                        imsg.done();
                    }).catch(err => {
                        console.error('[youtube.command]:', err);
                    });
            });

    }

    private search(q: string, msg: Message): Promise<string> {

        return new Promise<string>((resolve, reject) => {
            this._yt.search(q, 1, (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                let items = result.items;

                if (items.length < 1 || !items[0].id.videoId) {
                    resolve("Sorry boss, no videos found ...");
                    return;
                }

                let item = items[0];
                let vid = `https://www.youtube.com/watch?v=${item.id.videoId}`

                resolve(vid);
            });
        });
    }

    private getSearchQuery(content: string): string {

        let pos = content.indexOf(this._command) + this._command.length;
        let name = content.substr(pos);

        return name;
    }
}