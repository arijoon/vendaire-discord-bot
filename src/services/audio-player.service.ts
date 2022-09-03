import { injectable, inject } from 'inversify';
import { IAudioPlayer, IMessage } from './../contracts';
import * as path from 'path';
import { TYPES } from '../ioc/types';
import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection } from '@discordjs/voice';

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

  playFromYoutube(imsg: IMessage, url: string) {
    if (!imsg || !url) return;

    if (!this._ytdl) {
      this._ytdl = require('ytdl-core')
    }

    const stream = this._ytdl(url, { filter: 'audioonly' });

    return this.playFile(imsg, stream)
  }

  playRandomFile(imsg: IMessage, query?: string, folderName?: string, channelId?: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (!imsg.Message.member.voice.channel) {
        reject("no voice channels");
        return;
      }

      const audioPath = path.join(this._audioPath, folderName);
      let filename: string;

      if (!query) {
        filename = (await this._fileService.getAllFiles(audioPath)).crandom();
      } else {
        const filenames = (await this._fileService.getAllFilesWithName(audioPath, new RegExp(query)));

        if (filenames.length < 1) {
          reject("no files matched");
          return;
        }

        filename = filenames.crandom();
      }

      this.playFile(imsg, this._config.pathFromRoot(audioPath, filename), channelId);

      resolve();
    });
  }

  async playFile(imsg: IMessage, filename: string | ReadableStream, channelId?: string): Promise<void> {
    if (!imsg || !filename || this._working) return;

    this._working = true;

    const connection = joinVoiceChannel({
      channelId: channelId || imsg.Message.member.voice.channel.id,
      guildId: imsg.guidId,
      adapterCreator: imsg.Message.member.voice.channel.guild.voiceAdapterCreator
    })

    const player = createAudioPlayer()
    const resource = createAudioResource(filename)

    player.play(resource)
    player.on(AudioPlayerStatus.Idle, () => {
      this._logger.info('Finished playing the audio')
      this.onEnd(connection, player)
    })
    .on('error', (err) => {
      this.onEnd(connection, player, err)
    })

    connection.subscribe(player)
  }

  private onEnd(con: VoiceConnection, player: AudioPlayer, err?: any) {
    con && con.destroy()
    player && player.stop()

    if (err) {
      this._logger.error(err)
    }

    this._working = false;
  }
}