import { IMessage } from '../contracts/IMessage';
import { IConfig } from '../contracts/IConfig';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from '../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";
import { IFiles } from "../contracts/IFiles";
import { IHttp } from '../contracts/IHttpService';
import { IPermission } from '../contracts/IPermission';

import * as path from 'path';
import * as opt from 'optimist';
import { Message, MessageAttachment } from 'discord.js';

const MaxFileSize: number = 1048576; // 1MB

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

  subscription(imsg: IMessage) {
    const msg = imsg.Message;

    Promise.resolve().then(async _ => {

      const content = msg.content.trim();

      let argv = this.setupOptions(content.split(' '));
      let ops = argv.argv

      if(ops.h) {
        return imsg.send(argv.help(), { code: 'md' });
      }

      if(!ops.f) {
        return imsg.send("You must specify the folder with --f flag");
      }

      if(this._folders.indexOf(ops.f) < 0) {
        const readableFolders = this._folders.join(", ");
        return imsg.send(`${ops.f} is not in available list of folders: ${readableFolders}`);
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

      const y = ops._;
      const stream = await this._http.getFile(attachment.url);
      const dir = path.join(this._config.images["root"], this._config.images[ops.f]);
      const filename = await this._filesService.saveFile(stream, dir, attachment.filename);

      return imsg.send(`Successfully added as ${filename} in ${ops.f}`);
    }).then(info => {
      imsg.done();
    }).catch(err => {
      imsg.send("ooops, something went wrong", { reply: imsg.Message });
      imsg.done(err, true);
    });

  }

  setupOptions(args: string[]): any {
    var argv = opt(args)
      .usage(`Save file in the specified folder, max size: ${MaxFileSize/(1024*1024)}MB`)
      .options('f', {
        alias: 'folder',
        describe: 'specify the folder',
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