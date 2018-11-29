import { IMessage } from './../contracts';
import { Message } from 'discord.js';

export class MessageWrapper implements IMessage {
  Message: Message;
  Timer: ITimer;
  Content: string;
  Command: string;

  public readonly id: string;
  public readonly userId: string;
  public readonly author: string;
  public readonly guidId: string;
  public readonly channelId: string;
  public readonly isBot: boolean;
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
    this.author = msg.author.username;
    this.isBot = msg.author.bot;

    this.onDone = new Promise(r => this._onDoneResolver = r);
  }

  done(msg?: string, err?: any): void {
    this._onDone(msg, err);
    this._onDoneResolver({msg, err});
  }

  send(content?: string, options?: any): Promise<Message | Message[]> {
    if(options && !content) {
      return this.Message.channel.send(options);
    }

    return this.Message.channel.send(content, options);
  }

  fetchMessages(options?: any): Promise<string[]> {
    return this.Message.channel
      .fetchMessages(options)
      .then(msgs => {
        return msgs.map(m => m.content);
      });
  }

  fetchFullMessages(options?: any): Promise<IMessage[]> {
    return this.Message.channel
      .fetchMessages(options)
      .then(msgs => {
        return msgs.map(m => new MessageWrapper(() => undefined, m, this.Timer, m.content, this.Command));
      });
  }

  async getMentions(): Promise<string[]> {
    return this.Message.mentions.users.map(u => u.id);
  }

  replyDm(content?: string, options?: any): Promise<Message | Message[]> {
    return this.Message.author.send(content, options);
  }
}