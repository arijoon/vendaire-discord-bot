import { IClient } from '../contracts';
import { inject } from 'inversify';
import { injectable } from 'inversify';
import { commands } from '../static';
import { TYPES } from '../ioc/types';
import { commonRegex } from '../helpers';

import * as path from 'path';

@injectable()
export class RateCommand implements ICommand {

  readonly _command: string = commands.rate;

  readonly _chances = {
    0: "bloody disgusting, should kill self",
    1: "would not touch with a stick",
    2: "would not touch",
    8: "would like to decimate",
    9: "would absolutely decimate uncontrollably",
    10: "would drag my balls across broken glass to hear her fart through a walky talky"
  };

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IFiles) private _filesService: IFiles
  ) { }

  attach(): void {
    this._client
      .getCommandStream(this._command)
      .subscribe(imsg => {
        const msg = imsg.Message;

        let roll = this.getRoll(1);

        let result: string;
        let options: any = {};

        if (commonRegex.link.test(imsg.Content.trim())) {
          options.file = commonRegex.link.exec(imsg.Content)[0];
          result = `This is ${roll}/10 `
        } else {
          result = `${imsg.Content} is ${roll}/10 `
        }

        if (this._chances[roll])
          result += this._chances[roll]

        msg.channel.send(result, options)
          .then(() => imsg.done())
          .catch(err => imsg.done());

        if (roll > 8) {
          const dirPath = path.join(this._config.images["root"], commands.randomPic, 'fap');

          this._filesService.getRandomFile(dirPath)
            .then(file => {

              const filePath = this._config.pathFromRoot(dirPath, file);
              msg.channel.send('', { file: filePath })
            });
        }
      });
  }

  private getRoll(tries: number): number {
    let highest = 0;
    for (let i = 0; i < tries; i++) {
      let roll = Math.ceil(Math.random() * 11) - 1;

      if (roll > highest) highest = roll
    }

    return highest;
  }
}