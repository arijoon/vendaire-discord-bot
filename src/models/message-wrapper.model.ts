import { IMessage } from './../contracts/IMessage';
import { Message } from 'discord.js';

export class MessageWrapper implements IMessage {
    Message: Message;

    constructor(
        private _onDone: (msg?: string, err?: any) => void,
        msg: Message
    ) {
        this.Message = msg;
     }

    done(msg?: string, err?: any): void {
        this._onDone(msg, err);
    }
}