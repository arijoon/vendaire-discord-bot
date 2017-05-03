import {IMessage} from '../../contracts/IMessage';

const jimp = require('jimp');

export class CommonImage {

    public static fetchLastImage(imsg: IMessage): Promise<any> {

        const msg = imsg.Message;

        return msg.channel.fetchMessages({ limit: 10, before: msg.id })
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

                        resolve(image);
                    });
                })
        });
    }

}