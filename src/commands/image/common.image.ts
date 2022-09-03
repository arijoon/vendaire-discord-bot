import { Collection, FetchMessagesOptions, Message } from 'discord.js';
import { stringify } from 'querystring';
import {IMessage} from '../../contracts';

const jimp = require('jimp');

export class CommonImage {

    public static fetchLastImage(imsg: IMessage): Promise<any> {

        const msg = imsg.Message;
        const options: FetchMessagesOptions = { limit: 10, before: msg.id }

        return msg.channel.messages.fetch(options)
            .then((collected: Collection<string, Message<any>>) => {
                let validmsges = collected.filter((value) => (value.attachments.size > 0) ? true : false);
                
                if (validmsges.size < 0) {
                    return new Promise<string>((res, rej) => rej('No image found'));
                }

                let url = validmsges.first().attachments.first().url;

                return new Promise<string>((resolve, reject) => {
                    jimp.read(url, (err, image) => {
                        if(err) {
                             reject(err);
                             return;
                        }

                        resolve(image);
                    });
                })
        });
    }

}