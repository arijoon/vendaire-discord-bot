import { IAudioPlayer } from './../contracts/IAudioPlayer';
import { IClient } from './../contracts/IClient';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";
import { inject, injectable } from "inversify";
import { IDisposable } from "rx";
import { VoiceChannel, Message } from "discord.js";

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
                if(!msg.member.voiceChannel)
                    msg.channel.send("You aren't in any voice channels asshole");

                let ops = this.setupOptions(msg.content.split(' ')).argv;

                this._audioPlayer.playRandomFile(msg.member.voiceChannel, ops.q)
                    .then(_ => imsg.done())
                    .catch(err => {
                        msg.channel.send('Bad query');
                        imsg.done(err, true);
                });;

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