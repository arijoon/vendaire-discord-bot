import { IDisposable } from 'rx';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';


@injectable()
export class RollCommand implements ICommand {

  _command: string = commands.roll;
  _subscriptions: IDisposable[] = [];

  _reg = /(\d)?d(\d+)/g

  constructor(
    @inject(TYPES.IClient) private _client: IClient  ) { } 

  attach(): void {
    this._subscriptions.push(this._client
      .getCommandStream(this._command)
      .subscribe(imsg => {
        let msg = imsg.Message;

        const content = imsg.Content.trim();
        if (!content) {
          imsg.done();
          return;
        }

        (new Promise((resolve) => {

          let result = [];

          let match = this._reg.exec(content);

          if (!match) {
            resolve(msg.channel.send("Bad format mofo", { reply: msg }));
          }

          while (match != null) {

            let num = parseInt(match[1]) || 1;
            let die = parseInt(match[2]);

            let res = `Rolling ${num} x d${die}:`
            for (let i = 0; i < num; i++) {
              res += ` |${this.roll(die)}|`;
            }

            result.push(res);

            match = this._reg.exec(content);
          }

          resolve(msg.channel.send(result.join('\n'), { code: 'md' }));

        })).then(() => {
          imsg.done();
        }).catch(err => {
          imsg.done('', err);
        });
      }));
  }

  private roll(die: number) {
    let result = Math.floor(Math.random() * die);

    return result;
  }

}