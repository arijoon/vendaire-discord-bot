import { IClient, IMessage } from "../../contracts";
import * as discord from 'discord.js';
import { Subject, IObservable } from "rx";

export class StubClient implements IClient {
  _stream = new Subject<IMessage>();
  _messages: any = [];

  postMessage(msg: IMessage) {
    this._stream.onNext(msg);
  }

  getCommandStream(command: string): IObservable<IMessage> {
    return this._stream;
  }

  /**
   * Do not call done method on this channel
   */
  getGlobalCommandStream(): IObservable<IMessage> {
    return this._stream;
  }

  getClient(): discord.Client {
    throw new Error("Method not implemented.");
  }

  attachHelp(helps: IHelp[]) {
    throw new Error("Method not implemented.");
  }

  processDiscordMessage(guildId: string, channelId: string, messageId: string) : Promise<void> {
    throw new Error("Method not implemented.");
  }

  getNsfwChannel(guildId: string): Promise<string> {
    throw new Error("Method not implemented.");
  }

  sendMessage(guildId: string, channelId: string, content: string, options?: any): Promise<any> {
    return Promise.resolve(_ => {
      return this._messages.push({
        guildId,
        channelId,
        content,
        options
      });
    });
  }
}