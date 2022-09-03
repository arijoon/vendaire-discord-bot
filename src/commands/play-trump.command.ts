import { IAudioPlayer, IMessage } from './../contracts';
import { IClient } from './../contracts';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { inject, injectable } from 'inversify';
import { IDisposable } from 'rx';

import * as opt from 'optimist';
import { joinVoiceChannel } from '@discordjs/voice';
import { VoiceBasedChannel } from 'discord.js';

@injectable()
export class PlayTrump implements ICommand, IHasHelp {

  _command: string[] = commands.trump;
  _subscription: IDisposable;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IAudioPlayer) private _audioPlayer: IAudioPlayer
  ) { }

  public attach(): void {
    for(let command of this._command) {
    this._client
      .getCommandStream(command)
      .subscribe((imsg) => this.handler(imsg, command));
    }
  }

  handler(imsg: IMessage, command: string) {
    const msg = imsg.Message;
    let voiceChannel: VoiceBasedChannel;
    if (imsg.isBot) {
      voiceChannel = msg.mentions.members.first().voice.channel
    }
    else if (!msg.member.voice.channel) {
      msg.channel.send("You aren't in any voice channels asshole");

      return imsg.done('', true);
    } else {
      voiceChannel = msg.member.voice.channel;
    }

    const argv = this.setupOptions(imsg.Content.split(' '));
    const ops = argv.argv;

    if (ops.h) { // return help
      return imsg.send(argv.help(), { code: 'md' });
    }

    voiceChannel.id
    this._audioPlayer.playRandomFile(imsg, ops.q, command, voiceChannel.id)
      .then(_ => imsg.done())
      .catch(err => {
        msg.channel.send('Bad query');
        imsg.done(err, true);
      });
  }

  setupOptions(args: string[]): any {
    var argv = opt(args)
      .options('q', {
        alias: 'query',
        describe: 'Search for a query in filename',
        default: null
      }).options('h', {
        alias: 'help',
        describe: 'Display help message',
        default: false
      });

    return argv;
  }

  public detach(): void {
    this._subscription.dispose();
  }

  public getHelp(): IHelp[] {
    return this._command.map(c => ({
      Key: c,
      Message: `Play a ${c} in your current voicechat`,
      Usage: c 
    }));
  }
}