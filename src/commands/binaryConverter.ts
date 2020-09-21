import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { makeSubscription } from '../helpers/command';

@injectable()
export class BinaryConverter implements ICommand, IHasHelp {

  _commands: string[] = commands.binaryConverter;
  _numbers: RegExp = /\d+/;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.Logger) private _logger: ILogger,
  ) { }

  attach(): void {
    this._commands.forEach((command: string) => {
      makeSubscription(this._client.getCommandStream(command),
        this.subscription.bind(this))
    });
  }

  private async subscription(imsg: IMessage): Promise<any> {
    const content = imsg.Content;

    const match = this._numbers.exec(content)

    if (!match)
      return imsg.send("invalid number");

    const num: string = match[0];
    switch(imsg.Command) {
      case 'b2d':
        return imsg.send(this.toDecimal(num).toString());
      case 'd2b':
        return imsg.send(this.toBinary(parseInt(num, 10)))
      default:
        return imsg.send("Unsupported conversion");
    }
  }

  toBinary(decimal: number) {
    if (decimal == 0)
      return "";
    const next = Math.floor(decimal/2)
    return `${this.toBinary(next)}${decimal % 2}`
  }

  toDecimal(binary: string) {
    return binary
      .split("")
      .reverse()
      .map((digit, idx) =>
        parseInt(digit, 2) * Math.pow(2, idx)
      ).reduce((total, current) => total + current);
  }

  getHelp(): IHelp[] {
    return [
      {
        Key: this._commands.join(" | "),
        Message: "Binary conversion",
        Usage: `1011`
      }
    ]
  }
}