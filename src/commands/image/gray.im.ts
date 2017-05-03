import { IMessage } from '../../contracts/IMessage';
import { IDisposable } from 'rx';
import { IClient } from '../../contracts/IClient';
import { inject, injectable } from 'inversify';
import { ICommand } from '../../contracts/ICommand';
import { TYPES } from "../../ioc/types";
import { commands } from "../../static/commands";

const jimp = require('jimp');

@injectable()
export class ImGray implements ICommand {

    _command: string = commands.image.gray;
    _subscriptions: IDisposable[] = [];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
    ) { }


    attach(): void {
        this._subscriptions.push(this._client
            .getCommandStream(this._command)
            .subscribe(msg => {
                this.process(msg);
            }));
    }

    private process(imsg: IMessage) {
        const msg = imsg.Message;

        msg.channel.fetchMessages({ limit: 10, before: msg.id })
            .then(collected => {
                let validmsges = collected.filterArray((c, key, collection) => (c.attachments.size > 0) ? true : false);
                
                if (validmsges.length < 0) {
                    return new Promise<string>((res, rej) => rej('No image found'));
                }

                let url = validmsges[0].attachments.first().url;

                return new Promise<string>((resolve, reject) => {
                    jimp.read(url, (err, image) => {
                        if(err) {
                             reject(err);
                             return;
                        }

                        image.greyscale().getBuffer(jimp.MIME_JPEG, (err, res) => {
                            if(err) { reject(err); return; }

                            msg.channel.send('', { file: { attachment: res, name: `resul.jpg` } })
                                .then(_ => resolve())
                                .catch(err => reject(err));
                        })
                    });
                })

        }).then(res => {
            imsg.done();
        }).catch(err => {
            imsg.done(err, true);
        });
    }
}