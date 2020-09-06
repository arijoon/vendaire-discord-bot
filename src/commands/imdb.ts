import { IDisposable } from 'rx';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

import imdb from 'imdb-api';
import * as opt from 'optimist';
import { RichEmbed, Message } from 'discord.js';
import { colors } from '../static';

@injectable()
export class ImdbCommand implements ICommand {

    _command: string = commands.imdb;
    _subscription: IDisposable[] = [];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IHttp) private _http: IHttp,
        @inject(TYPES.ICacheString) private _cache: ICache<string, any>
    ) { }

    attach(): void {
        this._subscription.push(this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const fullContent = imsg.Content;

                let argv = this.setupOptions(fullContent.split(' '));
                let options = argv.argv;
                let content = options._;
                let year = options.y;

                if (!content) {
                    imsg.done();
                    return;
                }

                if (options.h) {
                    msg.channel.send(argv.help(), { code: 'md' })
                    imsg.done();
                    return;
                }

                content = content.join(' ');

                let res;
                if (this._cache.has(fullContent)) {
                    res = msg.channel.send(this._cache.getType<string>(content));

                } else if (options.s) {
                    res = this.fullSearch(content, msg);

                } else {

                    let req: any = { name: content };
                    if (year) req.year = year;

                    res = imdb.get(req, { apiKey: "fake"})
                        .then(res => {
                            let response = `Rated **${res.rating}** from *${res.votes}* votes\n${res.imdburl}`;
                            this._cache.set(fullContent, response);

                            return msg.channel.send(response);
                        });
                }

                res.then(_ => {
                    imsg.done();
                }).catch(err => {
                    msg.channel.send(` ${content} not found mofo`, { reply: msg });
                    imsg.done(err, true);
                });
            }));
    }

    fullSearch(query: string, msg: Message): Promise<any> {
        query = query.toLowerCase();
        let url = `https://v2.sg.media-imdb.com/suggests/${query[0]}/${query.replace(" ", "_")}.json`;

        return this._http.getJson(url)
            .then(res => {
                // Do some funky stuff to get real json from imdb result
                let buff = res.split('(');
                buff.shift();
                let result: string = buff.join('(');
                result = result.slice(0, -1);

                let json = JSON.parse(result);

                return json.d;
            }).then((res: any[]) => { // array of result
                if (!res || res.length < 1) throw new Error("No results found");

                let images = res.filter(movie => movie.i);

                let embed = (new RichEmbed())
                    .setTitle(`Search: ${query}`)
                    .setColor(colors.DARK_GOLD);

                if (images.length > 0)
                    embed.setThumbnail(images[0].i[0])


                for (let movie of res) {
                    embed.addField(`${movie.l} ${movie.y}`, `${movie.s ? `by ${movie.s}` : ''} http://www.imdb.com/title/${movie.id}/`, false)
                }

                return msg.channel.send('', { embed: embed });
            });
    }

    setupOptions(args: string[]): any {
        var argv = opt(args).options('y', {
            alias: 'year',
            describe: 'specify the movie year',
            default: null
        }).options('s', {
            alias: 'search',
            describe: 'Do a search for multiple matches',
            default: false
        }).options('i', {
            alias: 'image',
            describe: 'Add images to the ',
            default: false
        }).options('h', {
            alias: 'help',
            describe: 'Show this message',
            default: false
        });

        return argv;
    }
}