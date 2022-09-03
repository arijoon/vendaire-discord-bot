import { CommonImage } from './common.image';
import { IMessage } from '../../contracts';
import { IDisposable } from 'rx';
import { IClient } from '../../contracts';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import { commands } from '../../static';

const jimp = require('jimp');

@injectable()
export class ImMeme implements ICommand {

    _command: string = commands.image.meme;
    _argsReg: RegExp = /(.*)\|?(.*)/
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
        const content = imsg.Content;

        CommonImage.fetchLastImage(imsg).then(image => {
            return new Promise<any>((resolve, reject) => {

                jimp.loadFont(jimp.FONT_SANS_32_WHITE).then(function (font) {

                    image.print(font, 10, 10, content);

                    image.getBuffer(jimp.MIME_JPEG, (err, res) => {
                        if (err) { reject(err); return; }

                        imsg.send('', { file: { attachment: res, name: `result.jpg` } })
                            .then(_ => resolve(''))
                            .catch(err => reject(err));
                    });
                });
            });
        }).then(res => {
            imsg.done();
        }).catch(err => {
            imsg.done(err, true);
        });
    }
}