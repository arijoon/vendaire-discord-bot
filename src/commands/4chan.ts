import { IPermission } from '../contracts/IPermission';
import { IMessage } from '../contracts/IMessage';
import { IDisposable } from 'rx';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from '../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";
import { Message } from "discord.js";

import * as chan from '4chanjs';
import * as opt from 'optimist';
import * as _ from 'lodash';

@injectable()
export class FourChan implements ICommand {

    _command: string = commands.fourchan;
    _postedMessages: Message[] = [];
    _subscriptions: IDisposable[] = [];

    _bannedBoards: any = { 'hc': true, 'd': true, 'h': true }

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IPermission) private _permission: IPermission,
    ) { }

    attach(): void {
        this._subscriptions.push(this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const content = msg.content.trim();

                let argv = this.setupOptions(content.split(' '));
                let ops = argv.argv

                if(this._bannedBoards[ops.b]) {
                    let res = msg.channel.sendMessage(`board ${ops.b} is not allowed`);
                    this.onEnd(res, imsg);
                    return;
                }

                try { // unstable 4chan module
                    let board = chan.board(ops.b);

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
                    imsg.done();
                }

            }));
    }

    showHelp(imsg: IMessage, argv: any): void {
        let res = imsg.Message.channel.sendCode('', argv.help())
        this.onEnd(res, imsg);
    }

    postRandomThread(imsg: IMessage, ops: any, board: any): void {
        board.catalog((err, lst) => {

            if(!lst || lst.length < 1) {
                imsg.done()
                return;
            }

            let post = lst.random().threads.random();
            let url = `http://boards.4chan.org/${ops.b}/thread/${post.no}`;
            let file = `http://i.4cdn.org/${ops.b}/${post.tim}${post.ext}`

            let res = imsg.Message.channel.sendMessage(url, { file: file })
            this.onEnd(res, imsg);

        });
    }

    postRandomImage(imsg: IMessage, ops: any, board: any): void {
        board.catalog((err, lst: any[]) => {
            if(!lst || lst.length < 1) {
                imsg.done();
                return;
             }

            let thread;
            if(ops.q) {
                let threads = lst.map(i => i.threads);
                threads = _.flatten(threads);

                let reg = new RegExp(ops.q);
                threads = threads.filter(t => reg.test(t.sub) || reg.test(t.com));
                
                if(threads.length < 1) {
                    imsg.Message.channel.sendMessage("Nothing matched your search term");
                    imsg.done();
                    return;
                }

                thread = threads.random().no;

            } else {
                thread = lst.random().threads.random().no;
            }
            

            board.thread(thread, (err, posts: any[]) => {
                let fposts = posts.filter((v, i) => v.tim);

                if(fposts.length < 1) {
                    this.postRandomImage(imsg, ops, board);
                    return;
                }

                let post = fposts.random(); 
                let file = `http://i.4cdn.org/${ops.b}/${post.tim}${post.ext}`

                let res = imsg.Message.channel.sendMessage("", { file: file })
                    .then((msg: Message) => this._postedMessages.push(msg))

                this.onEnd(res, imsg);
            });

        });
    }

    onEnd(res: Promise<any>, imsg: IMessage): void {
        res.then(() => imsg.done())
        .catch(err => {
            // console.error(err);
            console.error(`[4cha.ts] Failed to process request ${imsg.Message.content}`);
            imsg.done();
        })
    }

    setupOptions(args: string[]): any {
        var argv = opt(args).options('b', {
            alias: 'board',
            describe: 'specify the board',
            default: 'b'
        }).options('h', {
            alias: 'help',
            describe: 'show this message',
            default: false
        }).options('i', {
            alias: 'image',
            describe: 'choose a random image from board',
            default: false
        }).options('q', {
            alias: 'query',
            describe: 'pass a query to search',
            default: null
        }).options('d', {
            alias: 'delete',
            describe: 'delete last posted image',
            default: false
        });

        return argv;
    }

}