import { IClient } from './../contracts';
import { TYPES } from '../ioc/types';
import { commands, PERMS } from '../static';
import { inject, injectable } from 'inversify';
import { IDisposable } from 'rx';
import { IMessage } from '../contracts';
import * as  opt from 'optimist';
import { getMainContent, mention } from '../helpers';

@injectable()
export class AuthorizeCommand implements ICommand {

  _command: string = commands.authorize;
  _subscriptions: IDisposable[];

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IPermission) private _perm: IPermission,
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

    const perm = getMainContent(ops);
    const users = await imsg.getMentions();

    if(!this._perm.isAdmin(imsg.author)) {
      return imsg.send("FUCK OFF!");
    }

    if (ops.h || !perm || !PERMS[perm] || users.length < 1) { // return help
      return imsg.send(argv.help(), { code: 'md' });
    }

    const permVal = PERMS[perm];
    const user = users[0];

    if(ops.d) {
      await this._perm.removePerm(permVal, user);
      return imsg.send(`${mention(user)} has lost ${perm} rights, so long dickhead!`);
    } 

    await this._perm.addPerm(permVal, user);
    return imsg.send(`${mention(user)} has been granted ${perm} rights, use it wisely!`);
  }

  setupOptions(args: string[]): any {
    var argv = opt(args)
      .usage(`Authorize the mentioned user for the role: authorize UPLOAD Arijoon\nAvailable perms: ${
        Object.keys(PERMS).join(", ")
      }`)
      .options('d', {
        alias: 'delete',
        describe: 'remove the permission',
      })
      .options('h', {
        alias: 'help',
        describe: 'show this message',
      });

    return argv;
  }
}