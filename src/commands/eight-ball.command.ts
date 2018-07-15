import { IMessage } from './../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands, swearWords } from '../static';

@injectable()
export class EightBall implements ICommand {

  _command: string = commands.eightball;
  _options: string[] = [
    "It is certain.",
    "It is decidedly so.",
    "Without a doubt.",
    "Yes - definitely.",
    "You may rely on it.",
    "As I see it, yes.",
    "Most likely.",
    "Outlook good.",
    "Yes.",
    "Signs point to yes.",
    "Reply hazy, try again",
    "Ask again later.",
    "Better not tell you now.",
    "Cannot predict now.",
    "Concentrate and ask again.",
    "Don't count on it.",
    "My reply is no.",
    "My sources say no",
    "Outlook not so good.",
    "Very doubtful."
  ];

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
  ) { }

  attach(): void {
    // Chosen folder
      this._client
        .getCommandStream(this._command)
        .subscribe(imsg => this.subscription(imsg));
    }

  subscription(imsg: IMessage) {
    Promise.resolve()
      .then(() => {
        if(!imsg.Content.trim()) {
          return imsg.send(`Well ask me something you ${swearWords.crandom()}`);
        }

        const answer = this._options.crandom();
        return imsg.send(answer)
      }).then(() => imsg.done())
      .catch(err => imsg.done(err, true));
  }
}