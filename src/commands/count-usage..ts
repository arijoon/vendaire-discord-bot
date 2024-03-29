import { IDisposable } from 'rx';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { MessageCollector, Message, FetchMessagesOptions } from 'discord.js';

@injectable()
export class CountUsage implements ICommand, IHasHelp {

  MAX_NUM = 5000;
  _command: string = commands.countusage;
  _cleanCommand: string = commands.clean;
  _collectors: MessageCollector[] = [];
  _subscriptions: IDisposable[] = [];
  _numReg = /\d+/;
  _phraseReg = /[A-Za-z\-\! ]+/;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IPermission) private _permission: IPermission
  ) { }

  attach(): void {
    this._subscriptions.push(this._client
      .getCommandStream(this._command)
      .subscribe(imsg => {
        let msg = imsg.Message;

        const content = imsg.Content;

        let numR = this._numReg.exec(content);
        let phraseR = this._phraseReg.exec(content);

        if (!phraseR) {
          imsg.done();
          return;
        }

        let phrase = phraseR[0].trim();

        let num;
        if (numR)
          num = Number(numR[0]);
        else
          num = 100;

        if (num > this.MAX_NUM) num = this.MAX_NUM;

        let phraseMatcher = new RegExp(phrase, 'i')

        this.fetchMessages(msg, num)
          .then(msges => {
            let authorMap = new Map<string, number>();

            let counter = 0;
            msges.forEach((m: Message, index) => {
              if (m.author.bot
                || !phraseMatcher.test(m.content))
                return;

              counter++;

              let u = m.author.username;

              if (!authorMap.has(u))
                authorMap.set(u, 1);
              else
                authorMap.set(u, authorMap.get(u) + 1);
            });

            let result = `Total in ${counter} messages:\n\n`;
            authorMap.forEach((count: number, uname: string) => {
              result += `\t${uname}: ${count}\n`;
            })

            imsg.send(result, { code: 'md' }).then(() => imsg.done());
          }).catch(err => {
            console.error(err);
            imsg.done();
          });
      }));

    this._subscriptions.push(this._client
      .getCommandStream(this._cleanCommand)
      .subscribe(imsg => {
        let msg = imsg.Message;
        const content = imsg.Content;

        if (!this._permission.isAdmin(imsg.userId)) {
          msg.channel.send('You cannot bulk delete');
          imsg.done();
          return;
        }

        let numR = this._numReg.exec(content);

        let num;
        if (numR)
          num = Number(numR[0]);
        else
          num = 100;

        if (num > this.MAX_NUM) num = this.MAX_NUM;

        this.fetchMessages(msg, num < 10 ? 10 : num)
          .then(msges => {

            if (msges.length > num) {
              msges = msges.slice(0, num);
            }

            msges = msges.filter(m => (m.author.bot || msg.mentions.users.get(m.author.id)) && m.deletable);

            msges.forEach(m => m.delete())

            imsg.done();
          }).catch(err => {
            console.error(err);
            imsg.done();
          });
      }));
  }

  public getHelp(): IHelp[] {
    return [
      {
        Key: this._command,
        Usage: `countusage TEXT NUMBER_OF_MESSAGES_TO_SEARCH (max: ${this.MAX_NUM})`,
        Message: "counts the number of times a text has appeared"
      },
      {
        Key: this._cleanCommand,
        Usage: "clean NUMBER_OF_MESSAGES_TO_REMOVE",
         Message: "removes the last x number of messages the bot has posted"
      }
    ]
  }

  fetchMessages(mainMessage: Message, remaining: number, result: Message[] = []): Promise<Message[]> {
    return new Promise<Message[]>((resolve, reject) => {
      let innerFetch = async (mainMsg: Message, remaining: number, result: Message[], resolve: Function, reject: Function) => {
        let current = remaining > 100 ? 100 : remaining;
        remaining -= current;

        let options: FetchMessagesOptions = { limit: current };
        if (result.length > 0) options.before = result[result.length - 1].id

        const msgs = await mainMsg.channel.messages.fetch(options)
        result.push.apply(result, [...msgs.values()])

        if (remaining == 0) {
          resolve(result);
          return;
        }

        return innerFetch(mainMsg, remaining, result, resolve, reject);
      };

      innerFetch(mainMessage, remaining, result, resolve, reject);
    });

  }


}