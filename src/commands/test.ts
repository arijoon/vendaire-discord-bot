import { IDisposable } from 'rx';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { MessageCollector, Message } from 'discord.js';
import { commonRegex, readbleFromString } from '../helpers';

@injectable()
export class TestCommand implements ICommand, IHasHelp {

  MAX_NUM = 5000;
  _command: string = "test"
  _cleanCommand: string = commands.clean;
  _collectors: MessageCollector[] = [];
  _subscriptions: IDisposable[] = [];
  _numReg = /\d+/;
  _phraseReg = /[A-Za-z\-\! ]+/;
  _mentionReg = /<@!(\d+)>/;
  _running = false;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IPermission) private _permission: IPermission,
    @inject(TYPES.IFiles) private _fileservice: IFiles
  ) { }

  attach(): void {
    this._subscriptions.push(this._client
      .getCommandStream(this._command)
      .subscribe(imsg => {
        if (this._running) {
          imsg.done();
          return;
        }
        this._running = true;
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

        let phraseMatcher = /^~?!/

        this.fetchMessages(msg, num)
          .then(async msges => {
            let authors = {};
            this._logger.info(`Fetched ${msges.length}`)

            let counter = 0;
            let res = msges.map((m: Message) => {
              if (m.author.bot
                || !m.content
                || phraseMatcher.test(m.content) 
                || commonRegex.link.test(m.content))
                return;

              counter++;

              let author = { 
                id: m.author.id,
                name: m.author.username
              };

              authors[m.author.id] = author;

              let content = m.content;

              return { author, content }
            }).filter(a => a);

            const res2 = res.map((item) => {
              const match = this._mentionReg.exec(item.content);
              if (match) {
                const username = authors[match[1]] && authors[match[1]].name;
                item.content = item.content.replace(this._mentionReg, username || "");
              }

                return item;
            });


            const data = readbleFromString(JSON.stringify({res: res2, authors}, null, 2))
            const filename = await this._fileservice.writeTmpFile(data, '.json');
            console.log(filename);
            msg.channel.sendCode('md', 'failed').then(() => imsg.done());
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

      let innerFetch = (mainMsg: Message, remaining: number, result: Message[], resolve: Function, reject: Function) => {
        let current = remaining > 100 ? 100 : remaining;
        remaining -= current;
        this._logger.info(`remaining: ${remaining}, current: ${current}`)

        let options: any = { limit: current };
        if (result.length > 0) options.before = result[result.length - 1].id

        mainMsg.channel.fetchMessages(options)
          .then(msgs => {
            result.push.apply(result, msgs.array())

            if (remaining == 0) {
              resolve(result);
              return;
            }

            innerFetch(mainMsg, remaining, result, resolve, reject);
          });
      };

      innerFetch(mainMessage, remaining, result, resolve, reject);
    });
  }
}