import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { getMainContent, lock, } from '../helpers';
import { makeSubscription } from '../helpers/command';
import * as opt from 'optimist';
import { StreamDispatcher, VoiceConnection } from 'discord.js';

const ytdl = require('ytdl-core')

@injectable()
export class PlayCommand implements ICommand, IHasHelp {

  _command: string = commands.play;

  // Move to redis to provide locking
  _playing: Map<string, IPlaying> = new Map()
  _lock = lock()

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IBasicCache) private _cache: IBasicCache,
    @inject(TYPES.IFiles) private _filesService: IFiles,
  ) { }

  getHelp(): IHelp[] {
    return [
      {
        Key: this._command,
        Message: 'Play a song from youtube',
        Usage: this.setupOptions(['']).help()
      }
    ]
  }

  attach(): void {
    makeSubscription(this._client.getCommandStream(this._command),
      this.subscription.bind(this))
  }

  private async subscription(imsg: IMessage) {
    let argv = this.setupOptions(imsg.Content.split(' '));
    let ops = argv.argv

    if (ops.h) {
      return imsg.send(argv.help(), { code: 'md' });
    } if (ops.p) {
      return this.handlePop(imsg)
    } if (ops.d) {
      return this.handleShift(imsg)
    } if (ops.s) {
      return this.handleStop(imsg)
    } if (ops.c) {
      return this.handleClear(imsg)
    } if (ops.l) {
      return this.handleList(imsg)
    } if (ops.k) {
      return this.handleSkip(imsg)
    }

    return this.handleAdd(imsg, ops)

  }

  async handlePop(imsg: IMessage) {
    const { etc } = await this.modifyPlaylist(imsg.guidId, async (playlist) => {
      const etc = playlist.songs.pop()

      return { playlist, etc }
    })
    return imsg.send(`Removed ${(etc && etc.title) || "nothing"} from the end of the queue`)
  }

  async handleShift(imsg: IMessage) {
    const { url, title } = await this.shiftSong(imsg.guidId)
    return imsg.send(`Removed ${title || "nothing"} from the queue`)
  }

  async handleStop(imsg: IMessage) {
    const playing = this._playing.get(imsg.guidId)

    if (!playing) {
      return imsg.send("No connection found for this server")
    }

    playing.connection.disconnect()
    this._playing.delete(imsg.guidId)

    return imsg.send("Left the voice channel")
  }

  async handleClear(imsg: IMessage) {
    await this.savePlaylist(imsg.guidId, null, true)
    return imsg.send("Cleared the playlist")
  }

  async handleSkip(imsg: IMessage) {
    const playing = this.getPlaying(imsg.guidId)

    if (playing && playing.dispatcher) {
      playing.dispatcher.end()
    }
  }

  async handleList(imsg: IMessage) {
    const playlist = await this.getPlaylist(imsg.guidId)
    const playing = this.getPlaying(imsg.guidId)

    if ((!playlist || playlist.songs.length < 1) && !playing) {
      return imsg.send('Queue is empty')
    }

    const current = playing
      ? `current) ${playing.current.title} ${playing.current.url} - ${playing.current.addedBy}\n`
      : ''

    const message: string = current +
     playlist.songs.map(({ title, url, addedBy }, index) => 
      `${index+1}) ${title} ${url} - ${addedBy}`
    ).join('\n')

    return imsg.send(message, { code: 'md', split: true })
  }

  async handleAdd(imsg: IMessage, ops) {
    let { result, playlist, playing, url } = await this._lock.aquire(async () => {
      let result
      const playlist = await this.getPlaylist(imsg.guidId)
      const playing = this._playing.get(imsg.guidId)

      const url = getMainContent(ops)
      if (url) {
        const { videoDetails: { title, video_url } } = await ytdl.getInfo(url)
        playlist.songs.push({ title, url: video_url, addedBy: imsg.author })
        await this.savePlaylist(imsg.guidId, playlist)
        result = imsg.send(`Added ${title} to playlist at ${playlist.songs.length}`)
      }

      return { result, playlist, playing, url }
    })

    // Check to join a channel
    if (!playing) {
      const vc = imsg.Message.member.voiceChannel
      if (!vc) {
        return imsg.send('You aren\' in any voice channels')
      }

      if (playlist.songs.length < 0) {
        this._logger.info(`No songs for ${imsg.guidId} leaving`)
        return
      }

      const connection = await vc.join()
      this._playing.set(imsg.guidId, { connection, initiatorId: imsg.userId, channel: imsg.channelId })
      await this.playSongs(imsg.guidId, playlist, connection)
    }

    if (!url && playing) {
      result = imsg.send('Already playing a song')
    }

    return result
  }

  async playSongs(guidId: string, playlist?: IPlaylist, connection?: VoiceConnection) {
    return this._lock.aquire(async () => {
      playlist = playlist || await this.getPlaylist(guidId)
      connection = connection || this._playing.get(guidId)?.connection
      const playing = this._playing.get(guidId)

      if (!playlist || playlist.songs.length < 1 || !playing) {
        this._logger.info(`No more songs, closing connecction`)
        this._playing.delete(guidId)

        connection && connection.disconnect()
        return
      }

      const song = await this.shiftSong(guidId)
      const { url, title } = song
      playing.current = song

      const stream = ytdl(url, { filter: 'audioonly' })
      playing.dispatcher = connection.playStream(stream)
        .on('end', () => {
          this._logger.info(`Finished playing ${title}: ${url}`)
          playing && delete playing.current

          this.playSongs(guidId, null, connection)
        })
        .on('error', (err) => {
          this._logger.error(`Error playing file, id: ${guidId}, title: ${title}, url: ${url}`, err)
          const playing = this._playing.get(guidId)
          if (playing) {
            this._client.sendMessage(guidId, playing.channel, `<@${playing.initiatorId}>, something went wrong whilst trying to play the song ${title}, contact admin, id: ${guidId}`)
            this._playing.delete(guidId)
            playing.connection.disconnect()
          }
        })
    })
  }

  async shiftSong(guildId: string): Promise<ISong> {
    const { etc } = await this.modifyPlaylist<ISong>(guildId, async (playlist) => {
      const song = playlist.songs.shift()
      return { playlist, etc: song }
    })

    return etc
  }

  async modifyPlaylist<T>(guildId: string, fn: (playlist: IPlaylist) => Promise<{ playlist: IPlaylist, etc: T }>):
    Promise<{ playlist: IPlaylist, etc: T }> {
    const playlist = await this.getPlaylist(guildId)
    const result = await fn(playlist)
    await this.savePlaylist(guildId, result.playlist)

    return result
  }

  async getPlaylist(guildId: string): Promise<IPlaylist> {
    const key = this.makeKey(guildId)
    if (await this._cache.has(key)) {
      return JSON.parse(await this._cache.get(key))
    }
    return {
      songs: []
    }
  }

  async savePlaylist(guildId: string, playlist: IPlaylist, del: boolean = false) {
    if (del) {
      return this._cache.remove(this.makeKey(guildId))
    }

    return this._cache.set(
      this.makeKey(guildId),
      JSON.stringify(playlist)
    )
  }

  getPlaying(guildId: string): IPlaying {
    return this._playing.get(guildId)
  }

  makeKey(guildId: string): string {
    return `play-yt:${guildId}`
  }

  setupOptions(args: string[]): any {
    return opt(args)
      .usage('Play songs from youtube')
      .options('p', {
        alias: 'pop',
        describe: 'delete the last item from playlist',
        default: false
      }).options('d', {
        alias: 'delete',
        describe: 'delete the first item from the playlist',
        default: false
      }).options('c', {
        alias: 'clear',
        describe: 'clear the playlist',
        default: false
      }).options('s', {
        alias: 'stop',
        describe: 'stop playing and leave the chat',
        default: false
      }).options('l', {
        alias: 'list',
        describe: 'list current playlist',
        default: false
      }).options('k', {
        alias: 'skip',
        describe: 'skip current song',
        default: false
      }).options('h', {
        alias: 'help',
        describe: 'show this message',
      });
  }
}

interface ISong {
  url: string,
  title: string,
  addedBy: string
}

interface IPlaylist {
  songs: ISong[]
}

interface IPlaying {
  connection: VoiceConnection,
  channel: string,
  initiatorId: string,
  current?: ISong,
  dispatcher?: StreamDispatcher
}