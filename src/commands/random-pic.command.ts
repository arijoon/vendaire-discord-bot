import { IMessage } from './../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import * as opt from 'optimist';

import * as path from 'path';
import { Message, MessageAttachment } from 'discord.js';
import { pathSeperator } from './add-pic.command';
import { getMainContent, fromImageRoot, filenameFromPath } from '../helpers';
import { FileServerApi } from '../services';

const RandomRange: number = 1/20;
const RandomRangeMin: number = 5;

@injectable()
export class RandomPic implements ICommand {

  _commands: string[] = commands.randomPics;
  _commandAliases = commands.randomPicsAlias;
  _command: string = commands.randomPic;

  _filePatterns: RegExp = new RegExp(`\.(${['jpeg', 'jpg',
    'png', 'bmp', 'link', 'gif', 'webm'].join("|")})$`)

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IFiles) private _filesService: IFiles,
    @inject(TYPES.IBasicCache) private _cache: IBasicCache,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(FileServerApi) private _fileServer: FileServerApi,
  ) { }

  attach(): void {
    // Chosen folder
    for (let i = 0; i < this._commands.length; i++) {
      const command = this._commands[i];

      this._client
        .getCommandStream(command)
        .subscribe(imsg => this.subscription(imsg, command));
    }

    // Map aliases
    for (let alias in this._commandAliases) {
      if (!this._commandAliases.hasOwnProperty(alias)) continue;
      this._client.getCommandStream(alias)
      .subscribe(imsg => this.aliasSub(imsg, alias, this._commandAliases[alias]))
    }
    // Random folder
    this._client
      .getCommandStream(this._command)
      .subscribe(imsg => this.subscription(imsg, this._command));
  }

  async aliasSub(imsg: IMessage, alias: string, command: string) {
    return await this.subscription(imsg, command);
  }

  async subscription(imsg: IMessage, command: string) {
    Promise.resolve().then(async () => {
      let argv = this.setupOptions(imsg.Content.split(' '));
      let ops = argv.argv;

      if (ops.h) { // return help
        return imsg.send(argv.help(), { code: 'md' });
      }

      if (ops.p) { // full path return image
        return this.postImage(imsg, ops.p);
      }

      const dir = this.extractDirectoryPathFromCommand(command, getMainContent(ops));
      const parent = this._command === command ? "" : this._command;

      const fullPath = path.join(this._config.images["root"], parent, dir);
      const albums = await this.parseAlbumFile(dir)
      const dirs = [dir, ...albums]

      if (ops.l) { // list the folders
        return this.listFolders(imsg, fullPath);
      }

      if (ops.c) // whether we should count files or post them
        return this.countFiles(fullPath)
          .then((count) => imsg.send(`This folder and subfolders has ${count} item(s)`))
      
      if (ops.s) // get statistics
        return this.getStatsMesasge(dirs)
        .then((result) => imsg.send(result, { code: 'md' }));

      return this.selectRandomFile(dirs)
        .then(async ({ filename, dir }) => {

          this._logger.info(`Selected file: ${filename}, from: ${dir}`);

          const guildId = imsg.guidId;
          let channelId = imsg.channelId;

          if (command.toLowerCase() == 'nsfw') {  // Special case
            channelId = await this._client.getNsfwChannel(guildId);

            if (!channelId)
              return imsg.send("No NSFW channels found to post this haram stuff you weirdo");
          }

          const { message, options, shouldCache } = await this.makeFileOptions(filename, ops.b);

          const sentMsg = this._client.sendMessage(guildId, channelId, message, options)

          return !shouldCache
            ? sentMsg
            : sentMsg.then(async (res: Message) => {
              const attach: MessageAttachment = res.attachments.values().next().value;
              if (!attach) return res;

              const url = attach.url;
              await this._cache.set(filename, url);

              return res;
            });
        });
    }).then(() => imsg.done())
      .catch(err => imsg.done(err, true));
  }

  async parseAlbumFile(dir: string): Promise<string[]> {
    const albums = await this._filesService.readFile(fromImageRoot(this._config, dir, '.album'))
      .catch(() => undefined)
    return albums
      ? albums.split(",").filter(a => a)
      : []
  }

  async makeFileOptions(filename: string, isSpoiler: boolean = false): Promise<{ message: string, shouldCache: boolean, options?: any}> {
    if (filename.endsWith('.link')) {
      return { message: await this._filesService.readFile(filename), shouldCache: false };
    }

    const name = `${isSpoiler ? "SPOILER_" : ""}${filenameFromPath(filename)}`;

    return {
      message: '', shouldCache: true, options: {
        files: [{
          attachment: await this._cache.has(filename)
          ? await this._cache.get(filename)
          : filename,
          name: name
        }]
      }
    }
  }

  async postImage(imsg, imagePath) {
    const fullPath = fromImageRoot(this._config, imagePath);

    return imsg.send('', { files: [fullPath ]});
  }

  async listFolders(imsg: IMessage, fullPath: string) {
    const cmdPath = imsg.Command == this._command
      ? path.join(this._config.images["root"], this._command)
      : fullPath

    const dir = this.extractDirectoryPathFromCommand(imsg.Command, imsg.Content);

    const folders = await this._filesService.getAllFolders(cmdPath);
    const message = folders.reduce((msg, current) => {
      const indentLevel = '\t'.repeat((current.match(/[\\\/]/g) || []).length);
      return `${msg}\n${indentLevel}${current}`;
    }, `Folders under ${dir}:\n`);

    return imsg.send(message, { code: 'md', split: true });
  }

  async selectRandomFile(paths: string[]): Promise<{ filename: string, dir: string }> {
    const { data: [item] } = await this._fileServer.randomFile(paths)

    return { filename: fromImageRoot(this._config, item.path, item.filename), dir: item.path }
  }

  countFiles(fullPath: string): Promise<number> {
    return this._filesService
      .getAllFiles(fullPath, { recursive: true, include: this._filePatterns })
      .then(lst => {
        return lst.length;
      });
  }

  async getStatsMesasge(dirs: string[]): Promise<any> {
    // Remove the root image from path
    dirs = dirs.map(d => d.replace(new RegExp(`${this._command}/?`), ""))
      
    const { data: stats} = await this._fileServer.stats(dirs);

    let result = `Top Contributors (${stats.count}):`;
    result += stats.user_contrib.map(u => `\n${u.username}: ${u.count}`).join("")

    return result;
  }

  /**
   * In case of directory commands, it will extract the path: "!!tfw/r hello world" -> "tfw/r"
   */
  private extractDirectoryPathFromCommand(command: string, content: string): string {
    let dir = command;
    if (content && 
      (content.startsWith(pathSeperator) || command.endsWith(pathSeperator))) {
      dir += content.split(/\s/)[0];
    }

    return dir;
  }

  _lastRandomInx: { [key: string]: number } = {};
  /**
   * generates a random by adding a number (using RandomRange*lst.lenght) to the last index selection
   * @param lst list to pick a random from
   */
  private getRandom(lst: string[], key: string) : string {
    if(!this._lastRandomInx[key]) {
      this._lastRandomInx[key]  = Math.floor(Math.random() * lst.length);
    }

    let range = Math.ceil(RandomRange * lst.length);
    range = range < RandomRangeMin ? RandomRangeMin : range;
    this._lastRandomInx[key] = (this._lastRandomInx[key] + (Math.ceil(Math.random() * range))) % lst.length;
    
    return lst[this._lastRandomInx[key]];
  }

  setupOptions(args: string[]): any {
    var argv = opt(args)
      .usage("Post a random picture from available folders/subfolders")
      .options('l', {
        alias: 'list',
        describe: 'list all available folders',
      }).options('c', {
        alias: 'count',
        describe: 'count the files, does not include album content',
      }).options('b', {
        alias: 'spoiler',
        describe: 'image will be spoilered',
        default: false
      }).options('s', {
        alias: 'stats',
        describe: 'show stats, includes immidiate album content',
      }).options('p', {
        alias: 'path',
        describe: 'full path of image file to post',
      }).options('h', {
        alias: 'help',
        describe: 'show this message',
      });

    return argv;
  }
}