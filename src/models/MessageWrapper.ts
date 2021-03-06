import { IMessage, IPipe } from './../contracts';
import { Message, TextChannel } from 'discord.js';

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
  public readonly pipes: IPipe<string, string>[];
  public readonly onDone: Promise<{ msg?: string; err?: any; }>;

  private _onDoneResolver: (reso: { msg?: string, err?: any}) => void;

  constructor(
    private _onDone: (msg?: string, err?: any) => void,
    msg: Message,
    timer: ITimer,
    content: string,
    command: string,
    pipes?: IPipe<string, string>[]
  ) {
    this.Message = msg;
    this.Timer = timer;
    this.Content = content;
    this.Command = command;
    this.pipes = pipes;

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

  async send(content?: string, options?: any): Promise<Message | Message[]> {
    if(options && !content) {
      return this.Message.channel.send(options);
    }

    return this.Message.channel.send(await this.processPipes(content), options);
  }

  async sendNsfw(content?: string, options?: any): Promise<Message | Message[]> {
    const channels = this.Message.guild.channels;

    // Determine if this channel is nsfw, otherwise pick 'nsfw' channel or first nsfw channel
    let channel: TextChannel
    if ((this.Message.channel as TextChannel).nsfw) {
      channel = this.Message.channel as TextChannel
    } else {
      const allNsfw = channels.filter((channel: TextChannel) => channel.nsfw)
      channel = allNsfw.filter(c => c.name == 'nsfw').first() as TextChannel
      || allNsfw.first() as TextChannel
    }
    

    return channel.send(await this.processPipes(content), options);
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

  private async processPipes(content: string): Promise<string> {
    if (this.pipes) {
      for(let p of this.pipes) {
        content = await p.process(content);
      }
    }

    return content
  }
}