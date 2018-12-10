import { Message } from 'discord.js';

export interface IMessage {

  readonly id: string;
  readonly userId: string;
  readonly guidId: string;
  readonly channelId: string;
  readonly author: string;
  readonly isBot: boolean;
  readonly Message: Message;
  readonly Timer: ITimer;
  readonly Content: string;
  readonly Command: string;
  readonly onDone: Promise<{ msg?: string, err?: any }>;

  done(msg?: string, err?: any): void;

  /** Send a message to the same channel */
  send(content?: string, options?: any): Promise<Message | Message[]>;

  /** Send a message to the nsfw channel of same server */
  sendNsfw(content?: string, options?: any): Promise<Message | Message[]>;

  replyDm(content?: string, options?: any): Promise<Message | Message[]>;

  /**
   * Returns an array of mentions
   */
  getMentions(): Promise<string[]>;

  /**
   * Get a set of messages as string
   * @param options fetch messageOption
   */
  fetchMessages(options?: any): Promise<string[]>;

  /**
   * Get a set of messages as IMessage
   * @param options fetch messageOption
   */
  fetchFullMessages(options?: any): Promise<IMessage[]>;
}