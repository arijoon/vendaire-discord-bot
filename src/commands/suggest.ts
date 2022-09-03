import { IDisposable } from 'rx';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

@injectable()
export class SuggestCommand implements ICommand {

    _command: string = commands.suggest;
    _subscription: IDisposable[] = [];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IHttp) private _http: IHttp,
        @inject(TYPES.IConfig) private _config: IConfig
    ) { }

    attach(): void {
        this._subscription.push(this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const content = imsg.Content;
                if (!content) {
                    imsg.done("Empty message", true);
                    return;
                }

                let url = `http://suggestqueries.google.com/complete/search?client=firefox&q=${content}`;

                this._http.get(url)
                    .then(res => {
                        let results = JSON.parse(`{"data":${res}}`).data;

                        res = "Suggestions:\n"
                        for (let item of results[1]) {
                            res += `\t - ${item}\n`;
                        }

                        return imsg.send(res, { code: 'md' });
                    }).then(_ => imsg.done())
                    .catch(err => {
                        imsg.done(err, true);
                    });
            }));
    }
}