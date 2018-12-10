import { IBoard, FourChanApi } from './../services';
import { IMessage } from '../contracts';
import { IDisposable } from 'rx';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { Message } from 'discord.js';

import * as opt from 'optimist';
import * as _ from 'lodash';
import { fromArray, getMainContent, mapFromArray } from '../helpers';

@injectable()
export class FourChan implements ICommand {

  _command: string = commands.fourchan;
  _postedMessages: Message[] = [];
  _subscriptions: IDisposable[] = [];
  _boards: {[name: string]: IBoard};

  _bannedBoards: any = { 'hc': true, 'd': true, 'h': true }

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IPermission) private _permission: IPermission,
    @inject(FourChanApi) private _chanApi: FourChanApi,
  ) { }

  attach(): void {
    this._subscriptions.push(this._client
      .getCommandStream(this._command)
      .subscribe(async imsg => {
        let msg = imsg.Message;

        const content = msg.content.trim();

        let argv = this.setupOptions(content.split(' '));
        let ops = argv.argv

        if (this._bannedBoards[ops.b]) {
          let res = msg.channel.send(`board ${ops.b} is not allowed`, { reply: msg });
          this.onEnd(res, imsg);
          return;
        }

        const b = ops.b || getMainContent(ops) || "fit";
        ops.b = b;

        try { // unstable 4chan module
          let board = this._chanApi.board(ops.b);

          if (!ops.b || !board) {
            imsg.done()
            return;
          }

          if (ops.h) {
            this.showHelp(imsg, argv);
          }
          else if (ops.d) {
            let item = this._postedMessages.pop();
            if (item) item.delete();
            imsg.done();

          } else if (ops.i) {
            this.postRandomImage(imsg, ops, board);

          } else {
            this.postRandomThread(imsg, ops, board);
          }
        } catch (e) {
          imsg.done('', true);
        }

      }));
  }

  showHelp(imsg: IMessage, argv: any): void {
    let res = imsg.Message.channel.send(argv.help(), { code: 'md' })
    this.onEnd(res, imsg);
  }

  postRandomThread(imsg: IMessage, ops: any, board: FourChanApi): void {
    board.catalog().then((lst: any[]) => {

      if (!lst || lst.length < 1) {
        imsg.done()
        return;
      }

      let post = lst.crandom().threads.crandom();
      let url = `http://boards.4chan.org/${ops.b}/thread/${post.no}`;
      let file = `http://i.4cdn.org/${ops.b}/${post.tim}${post.ext}`

      let res = imsg.Message.channel.send(url, { file: file })
      this.onEnd(res, imsg);

    });
  }

  postRandomImage(imsg: IMessage, ops: any, board: FourChanApi): void {
    board.catalog().then((lst: any[]) => {
      if (!lst || lst.length < 1) {
        imsg.done();
        return;
      }

      let thread;
      if (ops.q || ops.s) {
        let threads = lst.map(i => i.threads);
        threads = _.flatten(threads);


        let tests = []

        if (ops.q) {
          let reg = new RegExp(ops.q.toLowerCase());
          tests.push((t) => {
            return (t.sub && reg.test(t.sub.toLowerCase())) || (t.com && reg.test(t.com.toLowerCase()))
          });
        } if (ops.s) {
          let subjectReg = new RegExp(ops.s.toLowerCase());
          tests.push((t) => {
            if (t.sub)
              return subjectReg.test(t.sub.toLowerCase())
            return false;
          });
        }

        threads = threads.filter(t => {
          for (let test of tests) {
            if (!test(t)) return false;
          }

          return true;
        });

        if (threads.length < 1) {
          imsg.Message.channel.send("Nothing matched your search term", { reply: imsg.Message });
          imsg.done();
          return;
        }

        thread = threads.crandom().no;

      } else {
        thread = lst.crandom().threads.crandom().no;
      }

      return board.thread(thread).then(async (posts: any[]) => {
        let fposts = posts.filter((v, i) => v.tim);

        if (fposts.length < 1) {
          this.postRandomImage(imsg, ops, board);
          return;
        }

        let post = fposts.crandom();
        let file = `http://i.4cdn.org/${ops.b}/${post.tim}${post.ext}`

        const b: IBoard = (await this.getboards())[ops.b];
        return b.isWorkSafe
          ? imsg.send("", { files: [file] })
          : imsg.sendNsfw("", { files: [file] });
      });
    }).then((msg: Message) => this._postedMessages.push(msg))
      .then(_ => imsg.done())
      .catch(err => this.onError(err, imsg));
  }

  onEnd(res: Promise<any>, imsg: IMessage): void {
    res.then(() => imsg.done())
      .catch(err => this.onError(err, imsg))
  }

  onError(err, imsg: IMessage) {
    imsg.Message.channel.send("Oops something went wrong", { reply: imsg.Message });
    imsg.done(err, true);
  }

  async getboards() {
    if (!this._boards) {
      this._boards = mapFromArray(await this._chanApi.boards(), (board: IBoard) => board.name);
    }

    return this._boards;
  }

  setupOptions(args: string[]): any {
    var argv = opt(args)
      .options('b', {
        alias: 'board',
        describe: 'specify the board, defaults to /fit/',
        default: null 
      }).options('h', {
        alias: 'help',
        describe: 'show this message',
        default: false
      }).options('i', {
        alias: 'image',
        describe: 'choose a random image from board',
        default: true
      }).options('q', {
        alias: 'query',
        describe: 'pass a query to search',
        default: null
      }).options('s', {
        alias: 'subject',
        describe: 'pass a subject query to search in subject only',
        default: null
      }).options('d', {
        alias: 'delete',
        describe: 'delete last posted image',
        default: false
      });

    return argv;
  }

}
