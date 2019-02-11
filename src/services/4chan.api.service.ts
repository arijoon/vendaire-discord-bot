import { inject, injectable, optional } from 'inversify';
import { TYPES } from '../ioc/types';
import * as rp from 'request-promise';

const timeout = 60 * 10; // 10 mins

import { ReadThroughCacheFactory } from '../services';

@injectable()
export class FourChanApi {

  readonly baseUrl: string;
  readonly _board: string;
  readonly requestOptions: any;
  private readonly _boards: IReadThroughCache<IBoard[]>;
  private readonly _catalog: IReadThroughCache<any[]>;
  private readonly _threads: IReadThroughCache<any[]>;
  private readonly _page: IReadThroughCache<any[]>;
  private readonly _thread: IReadThroughCache<any[]>;

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.ReadThroughCacheFactory) private factory: ReadThroughCacheFactory,
    @inject(null) @optional() board?: string
  ) {
    this._board = board;
    this.baseUrl = _config.api["4chan"];

    this._boards = factory.makeCache((_) => this.boardsPop(), (_) => "FOURCHAN:BOARDS", timeout);
    this._catalog = factory.makeCache((_) => this.catalogPop(), (_) => `FOURCHAN:CATALOGUE:${board}`, timeout);
    this._threads = factory.makeCache((_) => this.threadsPop(), (_) => `FOURCHAN:THREADS:${board}`, timeout);
    this._page = factory.makeCache((num) => this.pagePop(num), (num) => `FOURCHAN:PAGE:${board}:${num}`, timeout);
    this._thread = factory.makeCache((num) => this.threadPop(num), (num) => `FOURCHAN:THREAD:${board}:${num}`, timeout);
  }

  board(board) {
    return new FourChanApi(this._config, this.factory, board);
  }

  boards(): Promise<IBoard[]> {
    return this._boards.get(null);
  }

  catalog(): Promise<any[]> {
    return this._catalog.get(null);
  }
  threads(): Promise<any[]> {
    return this._threads.get(null);
  }

  page(num): Promise<any[]> {
    return this._page.get(num);
  }

  thread(num): Promise<any[]> {
    return this._thread.get(num);
  }

  private boardsPop(): Promise<IBoard[]> {
    let uri = [this.baseUrl, "boards.json"].join("/");
    let options = this.getRequestOptions(uri);

    return rp(options).then(res => {
      return res.boards.map(board => ({
        title: board.title,
        name: board.board,
        isWorkSafe: !!board.ws_board
      }))
    });
  }

  private catalogPop(): Promise<any[]> {
    let uri = [this.baseUrl, this._board, "catalog.json"].join("/");
    let options = this.getRequestOptions(uri);

    return rp(options).then(res => res);
  }

  private threadsPop(): Promise<any[]> {
    let uri = [this.baseUrl, this._board, "threads.json"].join("/");
    let options = this.getRequestOptions(uri);

    return rp(options).then(res => res);
  };

  private pagePop(num): Promise<any[]> {
    let uri = [this.baseUrl, this._board, `${num}.json`].join("/");
    let options = this.getRequestOptions(uri);

    return rp(options).then(res => res.threads);
  };

  private threadPop(num): Promise<any[]> {
    let uri = [this.baseUrl, this._board, "thread", `${num}.json`].join("/");
    let options = this.getRequestOptions(uri);

    return rp(options).then(res => res.posts);
  }

  private getRequestOptions(uri): any {
    return {
      json: true,
      uri: uri,
      // In order to use this, your must invalidate cache based on this request
      // headers: {
      //   'if-modified-since': (new Date()).toUTCString()
      // }
    };
  }
}

export interface IBoard {
  isWorkSafe: boolean;
  title: string;
  name: string;
}