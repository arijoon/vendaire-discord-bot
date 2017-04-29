import { IMessage } from './../contracts/IMessage';
import { IDisposable } from 'rx';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";
import { MessageCollector, Message } from "discord.js";
import { swearWords } from "../static/swear-words";

import * as path from 'path';
import * as chan from '4chanjs';
import * as opt from 'optimist';

@injectable()
export class FourChan implements ICommand {

    _command: string = commands.fourchan;
    _collectors: MessageCollector[] = [];
    _subscriptions: IDisposable[] = [];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
    ) { }

    attach(): void {
        this._subscriptions.push(this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const content = msg.content.trim();

                let argv = this.setupOptions(content.split(' '));
                let ops = argv.argv

                let board = chan.board(ops.b);

                if(!board) {
                    imsg.done()
                    return;
                }

                if(ops.h) {
                    this.showHelp(imsg, argv);
                }
                else if(ops.i) { 
                    this.postRandomImage(imsg, ops, board);
                } else {
                    this.postRandomThread(imsg, ops, board);
                }

            }));
    }

    showHelp(imsg: IMessage, argv: any): void {
        imsg.Message.channel.sendCode('', argv.help())
            .then(() => imsg.done())
            .catch(err => {
                console.error(err);
                imsg.done();
            });
    }

    postRandomThread(imsg: IMessage, ops: any, board: any): void {
        board.catalog((err, lst) => {

            let post = lst.random().threads.random();
            let url = `http://boards.4chan.org/${ops.b}/thread/${post.no}`;
            let file = `http://i.4cdn.org/${ops.b}/${post.tim}${post.ext}`

            imsg.Message.channel.sendMessage(url, { file: file })
                .then(() => imsg.done())
                .catch(err => {
                    console.error(err);
                    imsg.done();
                });

        });
    }

    postRandomImage(imsg: IMessage, ops: any, board: any): void {
        board.threads((err, lst) => {
            let thread = lst.random().threads.random().no;

            board.thread(thread, (err, posts: any[]) => {
                let fposts = posts.filter((v, i) => v.tim);

                if(fposts.length < 1) {
                    this.postRandomImage(imsg, ops, board);
                    return;
                }

                let post = fposts.random(); 
                let file = `http://i.4cdn.org/${ops.b}/${post.tim}${post.ext}`

                imsg.Message.channel.sendMessage("", { file: file })
                    .then(() => imsg.done())
                    .catch(err => {
                        console.error(err);
                        imsg.done();
                    });
            });

        });
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
        });

        return argv;
    }

}