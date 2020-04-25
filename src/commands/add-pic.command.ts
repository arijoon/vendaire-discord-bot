import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { FileServerApi } from '../services';
import { getLastSection, readbleFromString, checkFolder, hash,
   duplicateStream, getUrlFromCurrentOrFromHistory, shouldSaveAsLink, optimize, nameToJpg } from '../helpers';

import * as path from 'path';
import * as opt from 'optimist';

export const pathSeperator = '/';
const MaxFileSize: number = 1024 * 1024 * 5; // 5MB
const MaxOptimizationSize: number = 1024 * 1024 * 25; // 30MB

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
      const url = await getUrlFromCurrentOrFromHistory(imsg);
      const dir = path.join(this._config.images["root"], commands.randomPic, fullFolder);

      let { data, size, name } = shouldSaveAsLink(url)
        ? { data: readbleFromString(url), size: url.length, name: `${getLastSection(url)}.link` }
        : await this._http.getFile(url);

      let tmpFile: string = null
      if (ops.p && size < MaxOptimizationSize) {
        // attempt optimization
        const ceil = ops.size;
        tmpFile = await optimize(await this._filesService.writeTmpFile(data, name), this._logger);
        name = nameToJpg(name);
        data = await this._filesService.readStream(tmpFile);
        size = ceil;
      }

      if(size > MaxFileSize) {
        if(!ops.o || !this._permission.isAdmin(imsg.userId))
          return imsg.send(`Attachment too big ${size}, max size: ${MaxFileSize} bytes`);
      }

      const uname = msg.author.username.replace(/[^\x00-\x7F]/g, "A");
      const [ hashStream, fileStream] = duplicateStream(data);
      const hashStr = await hash(hashStream);
      let result = "";

      try {

        let { data: hashSearch } = await this._fileServer.searchHash(hashStr);

        const hasDuplicates = hashSearch && hashSearch.length > 0;

        if (!hasDuplicates || ops.d) {
          const filename = await this._filesService.saveFile(fileStream, dir, `_${uname}_` + name);

          result = `Successfully added as ${filename} in ${fullFolder}, hash: ${hashStr}`;

          const { data: { hash } } = await this._fileServer
            .newFile({ filename, folder: fullFolder, path: `${fullFolder}/${filename}` });

          if (hash !== hashStr) {
            result += "\n Unmatching hashes, something has gone wrong!!"
            this._logger.error("Unmatching hashes", {fullFolder, filename, hash, hashStr})
          }
        } else {
          result += "No Image added, use -d flag to add duplicates"
        }

        if (hasDuplicates) {
          result += "\n\n**Duplicate Item**:";
          result += hashSearch.map(h => `\n${h.path}/${h.filename}`).join("");
        }
      }
      catch(e) {
        this._logger.error("Failed to get hash info", e)
      }
      finally {
        await this._filesService.removeTmpFile(tmpFile);
      }

      return imsg.send(result, { code: 'md' });
    }).then(_ => {
      imsg.done();
    }).catch(err => {
      imsg.send("ooops, something went wrong", { reply: imsg.Message, code: err });
      imsg.done(err, true);
    });

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
      }).options('d', {
        alias: 'add-duplicate',
        describe: `add the file even if it is a duplicate`,
        default: false
      }).options('p', {
        alias: 'optimize',
        describe: `Convert to JPG and ceil the filesize at 1000KB`,
        default: false
      }).options('s', {
        alias: 'size',
        describe: `Set optimization file size ceil in KB`,
        default: 1000
      }).options('h', {
        alias: 'help',
        describe: 'show this message',
      });

    return argv;
  }
}