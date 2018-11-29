import { IMessage } from "../../contracts";
import * as discord from 'discord.js';

export class StubMessage implements IMessage {
  isBot: boolean;
  Timer: ITimer;
  Message: discord.Message;  
  Content: string;
  Command: string;
  author: string;

  onDone: Promise<{ msg?: string; err?: any; }>;

  constructor(content: string, command?: string,
     public id: string = "1",
     public guidId: string = "1",
     public channelId: string = "1",
     public userId: string = "1"
    ) {
    this.Message = new discord.Message(null, null, null);
    this.Content = content;
    this.Command = command;

    this.onDone = new Promise(r => this.donePromiseCallback = r);;
    this.donePromise = this.onDone.then(() => {});
  }

  sentResult : { content?: string, options?: any};
  donePromise: Promise<void>;
  private donePromiseCallback: (resp: {msg?: string, err?: any}) => void;

  done(msg?: string, err?: any): void {
    this.donePromiseCallback({msg, err});
  }

  send(content?: string, options?: any): Promise<discord.Message | discord.Message[]> {
    this.sentResult = { content, options }

    return Promise.resolve<discord.Message>({} as discord.Message );
  }

  fetchMessages(options?: any): Promise<string[]> {
    throw new Error("Method not implemented.");
  }

  fetchFullMessages(options?: any): Promise<IMessage[]> {
    throw new Error("Method not implemented.");
  }

  replyDm(content?: string, options?: any): Promise<discord.Message | discord.Message[]> {
    throw new Error("Method not implemented.");
  }

  getMentions(): Promise<string[]> {
    throw new Error("Method not implemented.");
  }
}