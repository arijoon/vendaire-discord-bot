import { IAudioPlayer } from './../contracts/IAudioPlayer';
import { IClient } from './../contracts/IClient';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";
import { inject, injectable } from "inversify";
import { IDisposable } from "rx";
import { VoiceChannel, Message } from "discord.js";


@injectable()
export class SayHello implements ICommand {

    _command: string = commands.sayHello;
    _subscription: IDisposable;

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IAudioPlayer) private _audioPlayer: IAudioPlayer
    ) { }

    attach(): void {
        this._client
            .getCommandStream(this._command)
            .subscribe(msg => {
                msg.channel.sendMessage("Hi man!");
                this._audioPlayer.playFile(msg.member.voiceChannel, "bebe");
            });
    }

    detach(): void {
        this._subscription.dispose();
    }
}