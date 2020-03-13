import { commonRegex, getAll } from './../helpers/common-regex';
import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { FileServerApi } from '../services';
import { getLastSection, readbleFromString, checkFolder } from '../helpers';

import * as path from 'path';
import * as opt from 'optimist';

export const pathSeperator = '/';
const MaxFileSize: number = 1024 * 1024 * 5; // 5MB

@injectable()
export class AddPicCommand implements ICommand {

  _folders: string[] = commands.randomPics;
  _command: string = commands.addPic;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IHttp) private _http: IHttp,
    @inject(TYPES.IFiles) private _filesService: IFiles,
    @inject(TYPES.IPermission) private _permission: IPermission,
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

      const content = msg.content.trim();

      let argv = this.setupOptions(content.split(' '), imsg);
      let ops = argv.argv

      if(ops.h) {
        return imsg.send(argv.help(), { code: 'md' });
      }

      const fullFolder = ops.f || (ops._ && ops._.length > 0 ? ops._[0].trim() : null);
      checkFolder(fullFolder);

      const folder = this.extractParentFolder(fullFolder);
      if(!folder) {
        return imsg.send("You must specify the folder with -f flag");
      }

      if(this._folders.indexOf(folder) < 0) {
        const readableFolders = this._folders.join(", ");
        return imsg.send(`${folder} is not in available list of folders: ${readableFolders}`);
      }

      // Check for attachments or links
      const url = await this.getUrlFromCurrentOrFromHistory(imsg);
      const dir = path.join(this._config.images["root"], commands.randomPic, fullFolder);

      const { data, size, name } = this.shouldSaveAsLink(url)
        ? { data: readbleFromString(url), size: url.length, name: `${getLastSection(url)}.link` }
        : await this._http.getFile(url);

      if(size > MaxFileSize) {
        if(!ops.o || !this._permission.isAdmin(imsg.userId))
          return imsg.send(`Attachment too big ${size}, max size: ${MaxFileSize} bytes`);
      }

      const uname = msg.author.username.replace(/[^\x00-\x7F]/g, "A");
      const filename = await this._filesService.saveFile(data, dir, `_${uname}_` + name);
      let result = `Successfully added as ${filename} in ${fullFolder}`;

      try {
        const { data: { hash }} = await this._fileServer
        .newFile({ filename, folder: fullFolder, path: `${fullFolder}/${filename}`});

        result += `, hash: ${hash}`;

        let {data: hashSearch } = await this._fileServer.searchHash(hash);

        hashSearch = hashSearch
          .filter(h => !(h.path === fullFolder && h.filename === filename)) // filter the current one

        if (hashSearch && hashSearch.length > 0) {
          result += "\n\n**Duplicate Item**:";
          result += hashSearch.map(h => `\n${h.path}/${h.filename}`).join("");
        }
      }
      catch(e) {
        this._logger.error("Failed to get hash info", e)
      }

      return imsg.send(result, { code: 'md' });
    }).then(_ => {
      imsg.done();
    }).catch(err => {
      imsg.send("ooops, something went wrong", { reply: imsg.Message, code: err });
      imsg.done(err, true);
    });

  }

  /**
   * If message has any urls, extract that, otherwise get the attachments
   */
  private getUrl(imsg: IMessage) {
    const urls = getAll(imsg.Content, commonRegex.allLinks);

    if(urls && urls.length > 0) {
      return urls[0];
    }

    if (imsg.Message.attachments.size < 1) {
      throw new Error("No Attachments or links found");
    }
    const attachment = imsg.Message.attachments.first();

    return attachment.url;
  }


  linkableUrls = [
    /https:\/\/streamable.com/,
    /https?:\/\/[a-z\.]*imgur.com/
  ];
  private shouldSaveAsLink(url: string) {
    for (let item of this.linkableUrls) {
      if (item.test(url)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get url from current message or previous 10
   */
  private async getUrlFromCurrentOrFromHistory(imsg: IMessage) {
    try {
      return this.getUrl(imsg);
    } catch (_) {
      // Current message has none, search in history:
      const msgs = await imsg.fetchFullMessages({ limit: 10 });

      for (let msg of msgs) {
        try { //TODO very ugly, refactor asap
          return this.getUrl(msg);
        } catch (_) { }
      }
    }
    throw new Error("No Attachments or links found");
  }

  private extractParentFolder(folder: string) {
    return folder.split(pathSeperator)[0];
  }

  setupOptions(args: string[], imsg: IMessage): any {
    var argv = opt(args)
      .usage(`Save file from (url | attachment) in this message or previous ones in the specified folder, max size: ${MaxFileSize/(1024*1024)}MB`)
      .options('f', {
        alias: 'folder',
        describe: 'specify the folder, can have subfolders, e.g. tfw/r',
      }).options('o', {
        alias: 'override-size',
        describe: `override the size limit (you ${this._permission.isAdmin(imsg.userId) ? 'can' : '**cannot**'} do this)`,
        default: false
      }).options('h', {
        alias: 'help',
        describe: 'show this message',
      });

    return argv;
  }
}