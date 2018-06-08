import { IMessage } from './../contracts';
import { Message } from 'discord.js';

export class MessageWrapper implements IMessage {
  Message: Message;
  Timer: ITimer;

  constructor(
    private _onDone: (msg?: string, err?: any) => void,
    msg: Message,
    timer: ITimer,
  ) {
    this.Message = msg;
    this.Timer = timer;
  }

  done(msg?: string, err?: any): void {
    this._onDone(msg, err);
  }

  send(content?: string, options?: any): Promise<Message | Message[]> {
    return this.Message.channel.send(content, options);
  }
}