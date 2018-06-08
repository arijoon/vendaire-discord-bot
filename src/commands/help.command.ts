import { IAudioPlayer } from './../contracts';
import { IClient } from './../contracts';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { helpContent } from '../static';
import { inject, injectable } from 'inversify';
import { IDisposable } from 'rx';
import { VoiceChannel, Message } from 'discord.js';
import { IMessage } from '../contracts';


@injectable()
export class Help implements ICommand {

    _commands: string[] = commands.help;
    _subscriptions: IDisposable[];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
    ) { }

    public attach(): void {
        for (var i = 0; i < this._commands.length; i++) {
            let command = this._commands[i];           

            this._client
                .getCommandStream(command)
                .subscribe(this.handler);
        }
    }

    public detach(): void {
        for (var i = 0; i < this._subscriptions.length; i++) {
            this._subscriptions[i].dispose();
        }
    }


    handler(imsg: IMessage): void {
        const msg = imsg.Message;
        msg.channel.send(helpContent.usage, { code: 'md' })
        imsg.done();
    }
}