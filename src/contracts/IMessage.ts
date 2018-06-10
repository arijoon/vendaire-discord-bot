import { Message } from 'discord.js';

export interface IMessage {

  readonly id: string;
  readonly userId: string;
  readonly guidId: string;
  readonly channelId: string;
  Message: Message;
  Timer: ITimer;
  Content: string;
  Command: string;

  done(msg?: string, err?: any): void;

  /** Send a message to the same channel */
  send(content?: string, options?: any): Promise<Message | Message[]>;
}