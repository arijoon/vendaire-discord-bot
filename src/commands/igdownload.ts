import { IHttp } from '../contracts/IHttpService';
import { IMessage } from '../contracts/IMessage';
import { IDisposable } from 'rx';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from '../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";

import * as opt from 'optimist';

@injectable()
export class IgDownload implements ICommand {

    _command: string = commands.igdownload;
    _subscriptions: IDisposable[] = [];
    _userId = /{"id": "(\d+)"}/;
    _queryId = "17880160963012870";
    _api = "https://www.instagram.com/graphql/query/"; // GET with query_id, id, first

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IHttp) private _httpClient: IHttp,
    ) { }

    attach(): void {
        this._subscriptions.push(this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const content = msg.content.trim();

                let argv = this.setupOptions(content.split(' '));
                let ops = argv.argv

                if(ops.h || !ops._ || ops._.length < 1) {
                    msg.channel.send(argv.help(), { code: 'md' });
                    imsg.done();
                    return;
                }

                let url = ops._[0];
                this._httpClient.get(url)
                    .then(res => {

                        let match = this._userId.exec(res);
                        let id = match[1]

                        return this._httpClient.getJson(`${this._api}?query_id=${this._queryId}&id=${id}&first=${ops.n}`);

                    }).then(res => {
                        let nodes = res.data.user.edge_owner_to_timeline_media.edges;
                        let results = []

                        for(let node of nodes) {
                            results.unshift(node.node.display_url);
                        }

                        return results;
                    }).then((res: string[]) => {
                        return msg.channel.send('', { files: res });
                    }).then(res => {
                        imsg.done();
                    }).catch(err => {
                        imsg.done(err, true);
                    });
            }));
    }
    
    setupOptions(args: string[]): any {
        var argv = opt(args)
        .options('n', {
            alias: 'number',
            describe: 'specify the number of images to get',
            default: 10
        }).options('h', {
            alias: 'help',
            describe: 'show this message',
            default: false
        });

        return argv;
    }

}