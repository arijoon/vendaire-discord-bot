import { injectable, inject } from 'inversify';
import { IAudioPlayer } from './../contracts';
import { VoiceChannel, VoiceConnection } from 'discord.js';
import * as path from 'path';
import { TYPES } from '../ioc/types';

// declare let require: any;

@injectable()
export class AudioPlayerService implements IAudioPlayer {

  _ytdl: any;
  _working: boolean = false;
  _voiceConnection: VoiceConnection;
  _audioPath: string;

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IFiles) private _fileService: IFiles
  ) {
    this._audioPath = path.join(_config.app.assets.root, _config.app.assets.audio.root);
  }

  playFromYoutube(channel: VoiceChannel, url: string) {
    if (!channel || !url) return;

    if (!this._ytdl) {
      this._ytdl = require('ytdl-core')
    }

    channel.join().then(con => {

      let stream = this._ytdl(url, { filter: 'audioonly' });
      const listener = con.playStream(stream);

      listener.on('end', () => con.disconnect());
      listener.once('error', (err) => con.disconnect());
    }).catch(err => {
      this._logger.error(err);
    })
  }

  playRandomFile(channel: VoiceChannel, query?: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (!channel) {
        reject("no voice channels");
        return;
      }

      let filename: string;

      if (!query) {
        filename = (await this._fileService.getAllFiles(this._audioPath)).crandom();
      } else {
        const filenames = (await this._fileService.getAllFilesWithName(this._audioPath, new RegExp(query)));

        if (filenames.length < 1) {
          reject("no files matched");
          return;
        }

        filename = filenames.crandom();
      }

      this.playFile(channel, this._config.pathFromRoot(this._audioPath, filename));

      resolve();
    });
  }

  playFile(channel: VoiceChannel, filename: string): void {
    if (!channel || !filename || this._working) return;

    this._working = true;

    channel.join().then(con => {
      const listener = con.playFile(filename);

      listener.on('end', () => this.onEnd(con));
      listener.once('error', (err) => this.onEnd(con, err));
    }).catch(err => {
      this.onEnd(null, err);
    });
  }

  private onEnd(con: VoiceConnection, err?: any) {
    if (con)
      con.disconnect();

    if (err) {
      this._logger.error(err)
    }

    this._working = false;
  }
}