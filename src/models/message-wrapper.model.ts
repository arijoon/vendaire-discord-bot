import { IMessage } from './../contracts';
import { Message } from 'discord.js';

export class MessageWrapper implements IMessage {
  Message: Message;
  Timer: ITimer;
  Content: string;
  Command: string;

  constructor(
    private _onDone: (msg?: string, err?: any) => void,
    msg: Message,
    timer: ITimer,
    content: string,
    command: string
  ) {
    this.Message = msg;
    this.Timer = timer;
    this.Content = content;
    this.Command = command;
  }

  done(msg?: string, err?: any): void {
    this._onDone(msg, err);
  }

  send(content?: string, options?: any): Promise<Message | Message[]> {
    return this.Message.channel.send(content, options);
  }
}