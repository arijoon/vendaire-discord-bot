import { IMessage, IPipe } from './../contracts';
import { Message, MessageOptions, TextChannel } from 'discord.js';

export class MessageWrapper implements IMessage {
  Message: Message;
  BaseMessage?: Message;
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
    baseMsg?: Message,
    pipes?: IPipe<string, string>[]
  ) {
    this.Message = msg;
    this.BaseMessage = baseMsg;
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

  get currentMessage() {
    return this.BaseMessage ?? this.Message
  }

  async send(content?: string, options?: MessageOptions): Promise<Message | Message[]> {
    if(options && !content) {
      return this.currentMessage.channel.send(options);
    }

    return Promise.all(
      this.split(content).map(
        async (content) => 
        this.currentMessage.channel.send({
          content: this.applyCodeBlock(await this.processPipes(content), options),
          ...options
        })
      )
    )
  }

  private applyCodeBlock(str: string, options: any = {}): string {
    if (options.code) {
      const wrapper = '```'
      return `${wrapper}${str}${wrapper}`
    }

    return str
  }

  private split(str: string, parts: string[] = []): string[] {
    const len = 1950
    if (str.length < len) {
      return [...parts, str]
    }

    const idx = str.substring(0, len).lastIndexOf('\n')

    return this.split(
      str.substring(idx, str.length),
      [...parts, str.substring(0, idx)]
    )
  }

  async sendNsfw(content?: string, options?: any): Promise<Message | Message[]> {
    const channels = this.Message.guild.channels;

    // Determine if this channel is nsfw, otherwise pick 'nsfw' channel or first nsfw channel
    let channel: TextChannel
    if ((this.Message.channel as TextChannel).nsfw) {
      channel = this.Message.channel as TextChannel
    } else {
      const allNsfw = channels.cache.filter((channel: TextChannel) => channel.nsfw)
      channel = allNsfw.filter(c => c.name == 'nsfw').first() as TextChannel
      || allNsfw.first() as TextChannel
    }
    

    return channel.send({ content: await this.processPipes(content), ...options });
  }

  fetchMessages(options?: any): Promise<string[]> {
    return this.currentMessage.channel.messages
      .fetch({
        before: this.currentMessage.id,
        limit: 10,
        ...options
      })
      .then(msgs => {
        return msgs.map(m => m.content);
      });
  }

  fetchFullMessages(options?: any): Promise<IMessage[]> {
    return this.currentMessage.channel.messages
      .fetch({
        before: this.currentMessage.id,
        limit: 10,
        ...options
      })
      .then(msgs => {
        return msgs.map(m => new MessageWrapper(() => undefined, m, this.Timer, m.content, this.Command));
      });
  }

  async getMentions(): Promise<string[]> {
    return this.Message.mentions.users.map(u => u.id);
  }

  replyDm(content?: string, options?: any): Promise<Message | Message[]> {
    return this.Message.author.send({ content, ...options });
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