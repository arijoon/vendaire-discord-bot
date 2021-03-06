import { IClient } from '../contracts';
import { inject } from 'inversify';
import { injectable } from 'inversify';
import { commands } from '../static';
import { TYPES } from '../ioc/types';
import { Message } from 'discord.js';

import * as youtube_node from 'youtube-node';

@injectable()
export class YoutubeSearch implements ICommand {

    _yt: any;
    _command = commands.yt;

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IConfig) private _config: IConfig
    ){
        const YouTube: any = youtube_node;
        this._yt = new YouTube();
        this._yt.setKey(_config.app.youtube.key)
    }

    attach(): void {
        this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                const msg = imsg.Message;
                const q = imsg.Content;

                this.search(q, msg)
                    .then(res => {
                        msg.channel.send(res);
                        imsg.done();
                    }).catch(err => {
                        imsg.done(err, true);
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
}