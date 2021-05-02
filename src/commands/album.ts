import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import {
  readbleFromString, checkFolder, stat, fromImageRoot,
} from '../helpers';
import { makeSubscription } from '../helpers/command';
import { uniq } from 'lodash';
import * as opt from 'optimist';

@injectable()
export class AlbumCommand implements ICommand, IHasHelp {

  _folders: string[] = commands.randomPics;
  _command: string = commands.album;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IFiles) private _filesService: IFiles,
  ) { }

  getHelp(): IHelp[] {
    return [
      {
        Key: this._command,
        Message: "Create albums under a folder from other folders",
        Usage: this.setupOptions(['']).help()
      }
    ]
  }

  attach(): void {
    makeSubscription(this._client.getCommandStream(this._command),
      this.subscription.bind(this))
  }

  private async verifyFolder(folder: string) {
    checkFolder(folder)
    const dir = fromImageRoot(this._config, folder);
    const folderStat = await stat(dir)
    if (!(folderStat && folderStat.isDirectory())) {
      throw new Error(`${folder} does not exist or is not a valid directory`)
    }

    return true
  }

  private async subscription(imsg: IMessage) {
    return Promise.resolve().then(async _ => {
      let argv = this.setupOptions(imsg.Content.split(' '));
      let ops = argv.argv

      if(ops.h || !ops.t) {
        return imsg.send(argv.help(), { code: 'md' });
      }

      const toFolder: string = ops.t.trim()

      await this.verifyFolder(toFolder)

      const albumFile = fromImageRoot(this._config, toFolder, '.album')

      let currentFolders = []
      if (await stat(albumFile)) {
        // Album file exists
        const content = await this._filesService.readFile(albumFile, false)

        if (!(ops.o || ops.a)) { // overwrite or add flags not provided
          return imsg.send(`Album already exists in \`${toFolder}\` with folders \`${content}\``)
        }

        currentFolders = content.split(',')
      }

      const fromFolders: string[] = ops.s.split(',').map(s => s.trim())
      await Promise.all(fromFolders.map(this.verifyFolder.bind(this)))

      const newFolders = ops.o
        ? fromFolders
        : uniq([...currentFolders, ...fromFolders])

      const fileContent = newFolders.join(',')
      await this._filesService.saveFile(
        readbleFromString(fileContent),
        fromImageRoot(this._config, toFolder),
        '.album',
        false
      )

      return imsg.send(`Album setup under \`${toFolder}\` with \`${fileContent}\``)
    }).catch(err => {
      return imsg.send("Unable to make album", { reply: imsg.Message, code: err });
    });
  }

  setupOptions(args: string[]): any {
    return opt(args)
      .usage('Create al album which is a composition of other folders')
      .options('s', {
        alias: 'source',
        describe: 'specify source folders comma seperated without spaces, e.g. misc/f1,miscf2',
      }).options('t', {
        alias: 'target',
        describe: 'target folder name',
      }).options('o', {
        alias: 'overwrite',
        describe: 'overwrite the existing list with the new one',
        default: false
      }).options('a', {
        alias: 'add',
        describe: 'add to the existing list of folders',
        default: false
      }).options('h', {
        alias: 'help',
        describe: 'show this message',
      });
  }
}