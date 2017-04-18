import { IAudioPlayer } from './../contracts/IAudioPlayer';
import { IClient } from './../contracts/IClient';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";
import { inject, injectable } from "inversify";
import { IDisposable } from "rx";
import { VoiceChannel, Message } from "discord.js";


@injectable()
export class Disconnect implements ICommand {

    _command: string = commands.dc;
    _subscription: IDisposable;

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
    ) { }

    public attach(): void {
        this._client
            .getCommandStream(this._command)
            .subscribe(msg => {
                let cons = this._client.getClient().voiceConnections;
                cons.forEach((v, k) => v.disconnect());
            });
    }

    public detach(): void {
        this._subscription.dispose();
    }
}