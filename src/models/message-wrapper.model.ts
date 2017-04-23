import { IMessage } from './../contracts/IMessage';
import { Message } from 'discord.js';

export class MessageWrapper implements IMessage {
    Message: Message;

    constructor(
        private _onDone: () => void,
        msg: Message
    ) {
        this.Message = msg;
     }

    done(): void {
        this._onDone();
    }
}