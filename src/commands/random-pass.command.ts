import { getAll } from './../helpers/common-regex';
import { IMessage } from './../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';


@injectable()
export class RandomPassCommand implements ICommand {

  _command: string = commands.randompass;

  _characters: string[] = "qwertyuiopasdfghjklzxcvbnm1234567890!$%&*<>?@#;:.,-=+_".split("");
  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.Logger) private _logger: ILogger,
  ) { }

  attach(): void {
    this._client
      .getCommandStream(this._command)
      .subscribe(imsg => this.subscription(imsg));
  }

  async subscription(imsg: IMessage) {
    Promise.resolve().then(async () => {
      let numbers = getAll(imsg.Content, /\d+/g);

      if (!numbers) {
        return imsg.send("Specify the number of characters");
      }

      const count = parseInt(numbers[0], 10);

      let result = "";
      for (let i = 0; i < count; i++) {
        result += this._characters.crandom();
      }

      return imsg.send(result, { code: 'md'});
    }).then(() => imsg.done())
      .catch(err => imsg.done(err, true));
  }
}