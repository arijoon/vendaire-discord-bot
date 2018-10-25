import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

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
    @inject(TYPES.IHttp) private _http: IHttp,
    @inject(TYPES.IFiles) private _filesService: IFiles,
    @inject(TYPES.IPermission) private _permission: IPermission,
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

      let argv = this.setupOptions(content.split(' '));
      let ops = argv.argv

      if(ops.h) {
        return imsg.send(argv.help(), { code: 'md' });
      }

      const fullFolder = ops.f || (ops._ && ops._.length > 0 ? ops._[0].trim() : null);
      const folder = this.extractParentFolder(fullFolder);
      if(!folder) {
        return imsg.send("You must specify the folder with -f flag");
      }

      if(this._folders.indexOf(folder) < 0) {
        const readableFolders = this._folders.join(", ");
        return imsg.send(`${folder} is not in available list of folders: ${readableFolders}`);
      }

      if(imsg.Message.attachments.size < 1) {
        return imsg.send("No attachments found");
      }

      // Check for attachments
      const attachment = imsg.Message.attachments.first();

      if(attachment.filesize > MaxFileSize) {
        if(!ops.o || !this._permission.isAdmin(imsg.Message.author.username))
          return imsg.send(`Attachment too big ${attachment.filesize}, max size: ${MaxFileSize} bytes`);
      }

      const stream = await this._http.getFile(attachment.url);
      const dir = path.join(this._config.images["root"], commands.randomPic, fullFolder);
      const filename = await this._filesService.saveFile(stream, dir, `_${msg.author.username}_` + attachment.filename);

      return imsg.send(`Successfully added as ${filename} in ${fullFolder}`);
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

  setupOptions(args: string[]): any {
    var argv = opt(args)
      .usage(`Save file in the specified folder, max size: ${MaxFileSize/(1024*1024)}MB`)
      .options('f', {
        alias: 'folder',
        describe: 'specify the folder, can have subfolders, e.g. tfw/r',
      }).options('o', {
        alias: 'override-size',
        describe: 'override the size limit (only admin can)',
        default: false
      }).options('h', {
        alias: 'help',
        describe: 'show this message',
      });

    return argv;
  }

}