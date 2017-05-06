import { IAudioPlayer } from './../contracts/IAudioPlayer';
import { IClient } from './../contracts/IClient';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";
import { helpContent } from "../static/help-content";
import { inject, injectable } from "inversify";
import { IDisposable } from "rx";
import { VoiceChannel, Message } from "discord.js";
import { IMessage } from "../contracts/IMessage";


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