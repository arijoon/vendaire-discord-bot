import { IAudioPlayer } from './../contracts';
import { IClient } from './../contracts';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { inject, injectable } from 'inversify';
import { IDisposable } from 'rx';
import { VoiceChannel, Message } from 'discord.js';

import * as opt from 'optimist';

@injectable()
export class PlayTrump implements ICommand {

    _command: string = commands.trump;
    _subscription: IDisposable;

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IAudioPlayer) private _audioPlayer: IAudioPlayer
    ) { }

    public attach(): void {
        this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                const msg = imsg.Message;
                let voiceChannel;
                if(imsg.isBot) {
                  voiceChannel = msg.mentions.members.first().voiceChannel
                }
                else if (!msg.member.voiceChannel) {
                    msg.channel.send("You aren't in any voice channels asshole");
                } else {
                  voiceChannel = msg.member.voiceChannel;
                }

                let ops = this.setupOptions(msg.content.split(' ')).argv;

                this._audioPlayer.playRandomFile(voiceChannel, ops.q)
                    .then(_ => imsg.done())
                    .catch(err => {
                        msg.channel.send('Bad query');
                        imsg.done(err, true);
                    });
            });
    }

    setupOptions(args: string[]): any {
        var argv = opt(args).options('q', {
            alias: 'query',
            describe: 'Search for a query in filename',
            default: null
        });

        return argv;
    }


    public detach(): void {
        this._subscription.dispose();
    }
}