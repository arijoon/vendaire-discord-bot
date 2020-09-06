import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { FileServerApi } from '../services';
import { readbleFromString, hash, getUrlFromCurrentOrFromHistory,
   shouldSaveAsLink, getMainContent, isHashString } from '../helpers';

import * as opt from 'optimist';

@injectable()
export class ImageSearchCommand implements ICommand, IHasHelp {

  _command: string = commands.imageSearch;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IHttp) private _http: IHttp,
    @inject(FileServerApi) private _fileServer: FileServerApi,
  ) { }

  getHelp(): IHelp[] {
    return [
      {
        Key: this._command,
        Message: "Search for an image in repository",
        Usage: "imsearch | imsearch HASH"
      }
    ]
  }

  attach(): void {
    this._client
      .getCommandStream(this._command)
      .subscribe(imsg => this.subscription(imsg));
  }

  private subscription(imsg: IMessage) {
    const msg = imsg.Message;

    Promise.resolve().then(async _ => {

      const content = imsg.Content.trim();

      let argv = this.setupOptions(content.split(' '));
      let ops = argv.argv

      const hashStr = await this.hashString(imsg, ops);

      let result = `No Matches Found for ${hashStr}`;

      let { data: hashSearch } = await this._fileServer.searchHash(hashStr);

      if (hashSearch && hashSearch.length > 0) {
        result = `**Matches Found for ${hashStr}**:`;
        result += hashSearch.map(h => `\n${h.path}/${h.filename}`).join("");
      } 

      return imsg.send(result, { code: 'md' });
    }).then(_ => {
      imsg.done();
    }).catch(err => {
      imsg.done(err, true);
    });

  }

  async hashString(imsg: IMessage, ops) {
    const hashContent = getMainContent(ops).trim();

    if (isHashString(hashContent)) {
      return hashContent;
    }

    // Check for attachments or links
    const url = await getUrlFromCurrentOrFromHistory(imsg);

    const { data } = shouldSaveAsLink(url)
      ? { data: readbleFromString(url) }
      : await this._http.getFile(url);

    return await hash(data);
  }

  setupOptions(args: string[]): any {
    var argv = opt(args)
      .usage(`Search for an image in repository`)
      .options('h', {
        alias: 'help',
        describe: 'show this message',
      });

    return argv;
  }
}