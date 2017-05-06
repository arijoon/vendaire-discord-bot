import { Channel, RichEmbed } from 'discord.js';
import { inject, injectable } from 'inversify';
import { IConfig } from '../../contracts/IConfig';
import { IClient } from '../../contracts/IClient';
import { IDisposable } from 'rx';
import { ICommand } from '../../contracts/ICommand';
import { commands } from "../../static/commands";
import { TYPES } from "../../ioc/types";
import { colors } from "../../static/colors";

@injectable()
export class RockPaperSiccors implements ICommand {

    _command: string = commands.games.rps;
    _subscription: IDisposable[] = [];

    _actions: any = { 'rock': 'r', 'paper': 'p', 'sissor': 's' };
    _reverse: any = { 'r': 'rock', 'p': 'paper', 's': 'sissor' };
    _ranking: string[] = [ 'r', 's', 'p' ];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IConfig) private _config: IConfig
    ) { }

    attach(): void {
        this._subscription.push(this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const content = msg.content.trim();
                if (!content) {
                    imsg.done();
                    return;
                }


                // Not a performing algo, improve by keeping a dic of indexes
                let action = this.getAction(content);

                if (!action) {
                    msg.channel.send(`Can't play this game with ${action}`);
                    imsg.done('Bad action', true);
                    return;
                }

                let botAction = this._ranking.crandom();

                let bindex = this._ranking.indexOf(botAction);
                let pindex = this._ranking.indexOf(action);

                let res;
                if (pindex == bindex) { // draw 

                    res = msg.channel.send('', {
                        embed: (new RichEmbed())
                            .setTitle('Draw')
                            .setColor(colors.GREY)
                            .addField(`Bot and you both played ${this._reverse[botAction]}`, 'got lucky this time')
                    });
                } else {

                    let isBotWinner = (bindex + 1).clamp(0, this._ranking.length) == pindex;

                    let embed = (new RichEmbed())
                        .setTitle(`You ${isBotWinner ? 'Lost' : 'Won'}`)
                        .setColor(isBotWinner ? colors.RED : colors.GREEN)
                        .addField(`Bot Played ${this._reverse[botAction]}`, `You played ${this._reverse[action]}`)
                    res = msg.channel.send('', { embed: embed })
                }

                res.then(_ => imsg.done())
                    .catch(err => imsg.done(err, true));
            }));

    }

    getAction(content): string {
        if (content.length > 1) {
            let action = this._actions[content];
            return action
                ? action
                : null;

        } else {
            return this._ranking.indexOf(content) < 0
                ? null
                : content
        }
    }
}