import { IMessage } from './../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

import * as path from 'path';

@injectable()
export class DidThanosKillMeComand implements ICommand, IHasHelp {

  _command: string = commands.didthanoskillme;
  _patterns = ['Wins', 'Spares'];
  _messages: { [key: string]: string[] } = {
    'Wins': [
      'Thanos killed your ugly ass',
      'The worthless thing you call your life is no more thanks to Thanos',
      'Finally the day we were all waiting for, your end, all praise Thanos',
      'Enjoy your new home, HELL, thank you Mr Thanos, for wiping this wanker off my planet',
      'Earth was cleaned and you got wiped like a nasty germ, Thanos did a job well done'
    ],
    'Spares': [
      'Thanos spared you, really confused as to why',
      'You can keep living your worthless life',
      'You\'ve been spared, Thanos must believe in you, I don\'t',
      'Your life continues, unfortunately',
      'Lucky bastard, you\'ve been spared'
    ]
  }

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IFiles) private _filesService: IFiles,
  ) { }

  attach(): void {
    this._client
      .getCommandStream(this._command)
      .subscribe(imsg => this.subscription(imsg));
  }

  getHelp(): IHelp[] {
    return [{
      Key: this._command,
      Message: 'Determine whether thanos killed you',
      Usage: this._command
    }];
  }

  private subscription(imsg: IMessage) {
    Promise.resolve().then(async _ => {
      // 0 - wins
      // 1 - spares
      const userIdLastChar = imsg.userId[imsg.userId.length-1];
      const result = (+userIdLastChar) % 2;
      const pattern = this._patterns[result];
      const filename = await this.selectRandomFile(pattern);

      let message = this._messages[pattern].crandom();
      if(result == 0) {
        message = `**${message}**`
      }

      return imsg.send(message, { file: filename, reply: imsg.Message })
    }).then(() => imsg.done())
      .catch(err => imsg.done(err, true));
  }

  private selectRandomFile(pattern: string): Promise<string> {
    let fullPath = path.join(this._config.images["root"], this._config.images["commandImages"], this._command);

    return this._filesService
      .getAllFilesWithName(fullPath, new RegExp(pattern))
      .then(lst => {
        return this._config.pathFromRoot(fullPath, lst.crandom());
      });
  }
}