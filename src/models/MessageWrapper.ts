import { IMessage } from './../contracts';
import { Message } from 'discord.js';

export class MessageWrapper implements IMessage {
  Message: Message;
  Timer: ITimer;
  Content: string;
  Command: string;

  public readonly id: string;
  public readonly userId: string;
  public readonly guidId: string;
  public readonly channelId: string;
  public readonly onDone: Promise<{ msg?: string; err?: any; }>;

  private _onDoneResolver: (reso: { msg?: string, err?: any}) => void;

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

    this.id = msg.id;
    this.guidId = msg.guild.id;
    this.channelId = msg.channel.id;
    this.userId = msg.author.id;

    this.onDone = new Promise(r => this._onDoneResolver = r);
  }

  done(msg?: string, err?: any): void {
    this._onDone(msg, err);
    this._onDoneResolver({msg, err});
  }

  send(content?: string, options?: any): Promise<Message | Message[]> {
    return this.Message.channel.send(content, options);
  }
}