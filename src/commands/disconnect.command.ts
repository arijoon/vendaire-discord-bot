import { IAudioPlayer } from './../contracts';
import { IClient } from './../contracts';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { inject, injectable } from 'inversify';
import { IDisposable } from 'rx';
import { VoiceChannel, Message } from 'discord.js';


@injectable()
export class Disconnect implements ICommand {

    _command: string = commands.dc;
    _subscription: IDisposable;

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
    ) { }

    public attach(): void {
        this._subscription = this._client
            .getCommandStream(this._command)
            .subscribe(msg => {
                let cons = this._client.getClient().voiceConnections;
                cons.forEach((v, k) => v.disconnect());
                msg.done();
            });
    }

    public detach(): void {
        this._subscription.dispose();
    }
}