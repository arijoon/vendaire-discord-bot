import { IHttp } from '../contracts/IHttpService';
import { IMessage } from '../contracts/IMessage';
import { IDisposable } from 'rx';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from '../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";

import * as opt from 'optimist';
import * as crypto from 'crypto';
import { commonRegex } from "../helpers/common-regex";

@injectable()
export class IgDownload implements ICommand {

    _command: string = commands.igdownload;
    _subscriptions: IDisposable[] = [];
    _userId = /{"id":.?"(\d+)"}/;
    _rhx = /"rhx_gis":.?"(\w+)"/;
    _csrf = /"csrf_token":.?"(\w+)"/;
    _queryId = "9ca88e465c3f866a76f7adee3871bdd8";
    _api = "https://www.instagram.com/graphql/query/"; // GET with query_id, id, first
    _base = "https://www.instagram.com";

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
                
                let url = commonRegex.link.test(ops._[0])
                    ? commonRegex.link.exec(ops._[0])[0]
                    : `${this._base}/${ops._[0]}`

                let id: string;
                let rhx: string;
                let gis: string;
                let csrf: string;
                const headers = {
                  ['user-agent']: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"
                }

                this._httpClient.get(url, headers)
                    .then(res => {

                        const match = this._userId.exec(res);
                        const rhx_match = this._rhx.exec(res);
                        const csrf_match = this._csrf.exec(res);
                        id = match[1];
                        rhx = rhx_match[1];
                        csrf = csrf_match[1];

                      const variables = JSON.stringify({ user_id: id, first: ops.s || ops.n });
                      // const variables = JSON.stringify({"user_id":"4451807"});

                      return this._httpClient.getJson(`${this._api}?query_hash=${this._queryId}&variables=${encodeURIComponent(variables)}`,
                       this.makeHeaders(rhx, variables), this.makeCookie(csrf));

                    }).then(res => {
                      if (ops.s) {
                          const end = res.data.user.edge_owner_to_timeline_media.page_info.end_cursor;
                          const variables = JSON.stringify({ user_id: id, first: ops.n, after: end });

                          return this._httpClient.getJson(`${this._api}?query_hash=${this._queryId}&variables=${encodeURIComponent(variables)}`,
                            this.makeHeaders(rhx, variables), this.makeCookie(csrf));
                        }

                        return res;

                    }).then(res => {
                        const nodes = res.data.user.edge_owner_to_timeline_media.edges;
                        const results = []

                        for(let node of nodes) {
                            results.unshift(node.node.display_url);
                        }

                        return results;
                    }).then((res: string[]) => {
                        if(res.length > 10) {
                            for(let i = 0; i < res.length/10; i++) {
                                msg.channel.send('', { files: res.slice(i*10, Math.min(i*10 + 10, res.length)), split: true });
                            }

                            return msg.channel.send("Sending all");
                        } else {
                            return msg.channel.send('', { files: res, split: true });
                        }
                    }).then(res => {
                        imsg.done();
                    }).catch(err => {
                        imsg.done(err, true);
                    });
            }));
    }

    makeVariables(userId: string, first: number, after?: number): string {
      const variables: any = { user_id: userId, first: first};

      if(after) {
        variables.after = after
      }

      const jsonVars = JSON.stringify(variables);

      const result = encodeURIComponent(jsonVars);

      return result;
    }

    makeCookie(csrf: string) {
      return {
        ig_pr: '1',
        csrftoken: csrf
      };
    }

    makeHeaders(rhx: string, variables: string) {
      const str = `${rhx}:${variables}`

      const hash = crypto.createHash('md5').update(str).digest('hex');

      return {
        ['x-instagram-gis']: hash,
        ['x-requested-with']: 'XMLHttpRequest',
        ['user-agent']: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"
      };
    }
    
    setupOptions(args: string[]): any {
        var argv = opt(args)
        .options('n', {
            alias: 'number',
            describe: 'specify the number of images to get',
            default: 1
        }).options('s', {
            alias: 'skip',
            describe: 'specify the number of images to skip',
            default: null
        }).options('h', {
            alias: 'help',
            describe: 'show this message',
            default: false
        });

        return argv;
    }

}