import { IClient } from './../contracts';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { inject, injectable } from 'inversify';
import { IDisposable } from 'rx';
import { IMessage } from '../contracts';
import * as  opt from 'optimist';

@injectable()
export class AuthGenerator implements ICommand {

  _command: string = commands.authGen;
  _subscriptions: IDisposable[];

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.SessionManager) private _sessionManager: ISessionManager,
  ) { }

  public attach(): void {
    this._client
      .getCommandStream(this._command)
      .subscribe((imsg) => {
        this.handle(imsg)
        .then(() => imsg.done())
        .catch((err) => imsg.done(err, err));
      });
  }

  async handle(imsg: IMessage) {
    const argv = this.setupOptions(imsg.Content.trim().split(' '));
    const ops = argv.argv;

    if (ops.h) { // return help
      return imsg.send(argv.help(), { code: 'md' });
    }

    const session = await this._sessionManager.genSingleSession(imsg.userId);
    await imsg.send(`http://localhost:5010/public/login?id=${session.id}`);
  }

  setupOptions(args: string[]): any {
    var argv = opt(args)
      .usage("Post a random picture from available folders/subfolders")
      .options('h', {
        alias: 'help',
        describe: 'show this message',
      });

    return argv;
  }
}