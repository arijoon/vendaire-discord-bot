import { inject, injectable, optional } from 'inversify';
import { TYPES } from '../ioc/types';

import * as rp from 'request-promise';

@injectable()
export class FourChanApi {

    readonly baseUrl: string;
    readonly _board: string;
    readonly requestOptions: any;

    constructor(
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(null) @optional() board?: string
    ) {
        this._board = board;
        this.baseUrl = _config.api["4chan"];
    }

    boards(): Promise<any> {
        let uri = [this.baseUrl, "boards.json"].join("/");
        let options = this.getRequestOptions(uri);

        return rp(options).then(res => res.boards);

    }

    board(board) {
        return new FourChanApi(this._config, board);
    }

    catalog(): Promise<any[]> {
        let uri = [this.baseUrl, this._board, "catalog.json"].join("/");
        let options = this.getRequestOptions(uri);

        return rp(options).then(res => res);
    }

    threads(): Promise<any[]> {
        let uri = [this.baseUrl, this._board, "threads.json"].join("/");
        let options = this.getRequestOptions(uri);

        return rp(options).then(res => res);
    };

    page(num): Promise<any[]> {
        let uri = [this.baseUrl, this._board, `${num}.json`].join("/");
        let options = this.getRequestOptions(uri);

        return rp(options).then(res => res.threads);
    };

    thread(num): Promise<any[]> {
        let uri = [this.baseUrl, this._board, "thread", `${num}.json`].join("/");
        let options = this.getRequestOptions(uri);

        return rp(options).then(res => res.posts);
    }

    private getRequestOptions(uri): any {
        return {
            json: true,
            uri: uri,
            headers: {
                'if-modified-since': (new Date()).toUTCString()
            }
        };
    }

}