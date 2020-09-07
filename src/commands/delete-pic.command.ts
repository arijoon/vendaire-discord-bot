import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { FileServerApi } from '../services';
import { getMainContent, isHashString, hashName } from '../helpers';

import * as opt from 'optimist';

@injectable()
export class DeleteCommand implements ICommand {

  _folders: string[] = commands.randomPics;
  _command: string = commands.deletePic;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IPermission) private _permission: IPermission,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(FileServerApi) private _fileServer: FileServerApi,
  ) { }

  attach(): void {
    this._client
      .getCommandStream(this._command)
      .subscribe(imsg => this.subscription(imsg));
  }

  private subscription(imsg: IMessage) {
    const msg = imsg.Message;

    Promise.resolve().then(async _ => {

      const content = imsg.Content

      let argv = this.setupOptions(content.split(' '));
      let ops = argv.argv

      if(ops.h) {
        return imsg.send(argv.help(), { code: 'md' });
      }

      const hash = getMainContent(ops);

      if (!isHashString(hash)) {
        return imsg.send(`Invalid hash ${hash}`);
      }

      this._permission.verifyAdmin(imsg.author, imsg.userId);

      const uname = hashName(imsg.author);

      let result = "Nothing found";
      let {data: hashSearch } = await this._fileServer.searchHash(hash);

      if (hashSearch && hashSearch.length > 0) {
        result = "\n\n**Found Result**:";
        result += hashSearch.map(h => `\n${h.path}/${h.filename}`)
        .map(h => h.indexOf(uname) < 0 ? `${h} \t X` : h) // Mark result by other users
        .join("");

        if (!ops.d) {
          const { data: { count } } = await this._fileServer.delete({ hash, user: uname});
          result += `\n\nDeleted ${count} item(s)`
          this._logger.info(`${uname} DELETE` + result);
        }
      }

      return imsg.send(result, { code: 'md' });
    }).then(_ => {
      imsg.done();
    }).catch(err => {
      imsg.send("ooops, something went wrong", { reply: imsg.Message, code: err });
      imsg.done(err, true);
    });
  }

  setupOptions(args: string[]): any {
    var argv = opt(args)
      .usage('Delete an item using it\'s hash key')
      .options('d', {
        alias: 'dry',
        describe: 'Dry run, only show items that could be deleted',
      })
      .options('h', {
        alias: 'help',
        describe: 'show this message',
      });

    return argv;
  }
}