import { IMessage } from "../../contracts";
import * as discord from 'discord.js';

export class StubMessage implements IMessage {
  Timer: ITimer;
  Message: discord.Message;  
  Content: string;
  Command: string;

  constructor(content: string, command?: string,
     public id: string = "1",
     public guidId: string = "1",
     public channelId: string = "1"
    ) {
    this.Message = new discord.Message(null, null, null);
    this.Content = content;
    this.Command = command;

    this.donePromise = new Promise<void>(r => this.donePromiseCallback = r);
  }

  sentResult : { content?: string, options?: any};
  donePromise: Promise<void>;
  private donePromiseCallback: () => void;

  done(msg?: string, err?: any): void {
    this.donePromiseCallback();
  }

  send(content?: string, options?: any): Promise<discord.Message | discord.Message[]> {
    this.sentResult = { content, options }

    return Promise.resolve<discord.Message>({} as discord.Message );
  }
}