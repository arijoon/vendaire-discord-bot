import { Channel, RichEmbed } from 'discord.js';
import { inject, injectable } from 'inversify';
import { IClient } from '../../contracts';
import { IDisposable } from 'rx';
import { commands } from '../../static';
import { TYPES } from '../../ioc/types';
import { colors } from '../../static';

@injectable()
export class RockPaperSiccors implements ICommand {

    _command: string = commands.games.rps;
    _subscription: IDisposable[] = [];

    _actions: any = { 'rock': 'r', 'paper': 'p', 'sissor': 's' };
    _reverse: any = { 'r': 'rock', 'p': 'paper', 's': 'sissor' };
    _ranking: string[] = [ 'r', 's', 'p' ];

    _winner: string[] = [ 'winner winner chicken dinner', 'I\'m the best mofo', 'what made you think you can beat me', 'keep coming, I keep winning', 
        'you were born to lose mofo', 'really? You thought you had a chance', 'I know I aint real but damn you suck son'];

    _loser: string[] = [ 'I\'ll get you next time', 'this isn\'n the end', "I'm just getting started", "you think you're a winner fagman?",
        "I don't like losing, don't make me take it out on your mama", "I'm gonna dox your ass with my superior AI capabilities if you keep fucking me up"];

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

                let bindex = this._ranking.indexOf(botAction);// 2
                let pindex = this._ranking.indexOf(action);//0

                let res;
                if (pindex == bindex) { // draw 

                    res = msg.channel.send('', {
                        embed: (new RichEmbed())
                            .setTitle('Draw')
                            .setColor(colors.GREY)
                            .addField(`Bot and you both played ${this._reverse[botAction]}`, 'got lucky this time')
                    });
                } else {

                    let isBotWinner = (bindex + 1) % this._ranking.length == pindex;

                    let embed = (new RichEmbed())
                        .setDescription(isBotWinner ? this._winner.crandom() : this._loser.crandom())
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