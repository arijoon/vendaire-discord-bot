import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { FileServerApi } from '../services';
import { getMainContent } from '../helpers';

import * as opt from 'optimist';


@injectable()
export class FolderSearch implements ICommand, IHasHelp {

  _command: string = commands.folderSearch;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
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

      const content = imsg.Content.trim();

      let argv = this.setupOptions(content.split(' '), imsg);
      let ops = argv.argv

      if (ops.h) {
        return imsg.send(argv.help(), { code: 'md' });
      }

      const query = getMainContent(ops);
      const { data: { paths } } = await this._fileServer.searchFolder(query);
      let result = "";

      result = paths.length < 1
        ? `No matches found for ${query}`
        : `Found ${paths.length} matches\n${paths.join("\n")}`;

      return imsg.send(result, { code: 'md' });
    }).then(_ => {
      imsg.done();
    }).catch(err => {
      imsg.send("ooops, something went wrong", { reply: imsg.Message, code: err });
      imsg.done(err, true);
    });
  }

  getHelp(): IHelp[] {
    return [
      {
        Key: this._command,
        Message: "Search for a folder",
        Usage: `STRING`
      }
    ]
  }

  setupOptions(args: string[], imsg: IMessage): any {
    var argv = opt(args)
      .usage(`Search for a folder by name`)
      .options('h', {
        alias: 'help',
        describe: 'show this message',
      });

    return argv;
  }
}