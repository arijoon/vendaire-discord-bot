import { injectable } from 'inversify';
import { Message } from "discord.js";
import { IMessageUtils } from './../contracts/IMessageUtils';

@injectable()
export class MessageUtilsHelper implements IMessageUtils {

    Delete(msg: Message): Promise<any> {
        return msg.deletable
            ? msg.delete()
            : new Promise<any>((resolve, reject) => {
                reject("Cannot delete");
            });
    }

}