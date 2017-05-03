import { IDisposable } from 'rx';
import { IClient } from '../contracts/IClient';
import { injectable, inject } from 'inversify';
import { ICommand } from './../contracts/ICommand';
import { TYPES } from "../ioc/types";
import { commands } from "../static/commands";
import { MessageCollector, Message } from "discord.js";
import { swearWords } from "../static/swear-words";
import { IPermission } from "../contracts/IPermission";

import * as path from 'path';

@injectable()
export class CountUsage implements ICommand {

    MAX_NUM = 5000;
    _command: string = commands.countusage;
    _cleanCommand: string = commands.clean;
    _collectors: MessageCollector[] = [];
    _subscriptions: IDisposable[] = [];
    _numReg = /\d+/;
    _phraseReg = /[A-Za-z\-\! ]+/;


    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IPermission) private _permission: IPermission
    ) { }

    attach(): void {
        this._subscriptions.push(this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                let msg = imsg.Message;

                const content = msg.content;

                let numR = this._numReg.exec(content);
               let phraseR = this._phraseReg.exec(content);

                if(!phraseR) {
                    imsg.done();
                    return;
                }

                let phrase = phraseR[0].trim();

                let num;
               if(numR)
                    num = Number(numR[0]);
                else
                    num = 100;

                if(num > this.MAX_NUM) num = this.MAX_NUM;
                
                let phraseMatcher = new RegExp(phrase, 'i')

                this.fetchMessages(msg, num)
                    .then(msges => {
                        let authorMap = new Map<string, number>();

                        let counter = 0;
                        msges.forEach((m: Message, index) => {
                            if (m.author.bot
                                || !phraseMatcher.test(m.content)) 
                                return;

                            counter ++;

                            let u = m.author.username;

                            if (!authorMap.has(u))
                                authorMap.set(u, 1);
                            else
                                authorMap.set(u, authorMap.get(u) + 1);
                        });

                        let result = `Total in ${counter} messages:\n\n`;
                        authorMap.forEach((count: number, uname: string) => {
                            result += `\t${uname}: ${count}\n`;
                        })

                        msg.channel.sendCode('md', result).then(() => imsg.done());
                    }).catch(err => {
                        console.error(err);
                        imsg.done();
                    });
            }));

        this._subscriptions.push(this._client
            .getCommandStream(this._cleanCommand)
            .subscribe(imsg => {
                let msg = imsg.Message;
                const content = msg.content;

                if(!this._permission.isAdmin(msg.author.username)) {
                    msg.channel.send('You cannot bulk delete');
                    imsg.done();
                    return;
                }

                let numR = this._numReg.exec(content);

                let num;
                if (numR)
                    num = Number(numR[0]);
                else
                    num = 100;

                if (num > this.MAX_NUM) num = this.MAX_NUM;

                this.fetchMessages(msg, num)
                    .then(msges => {
                        msges = msges.filter(m => m.author.bot && m.deletable);

                        msges.forEach(m => m.delete())

                        imsg.done();
                    }).catch(err => {
                        console.error(err);
                        imsg.done();
                    });
            }));
    }

    fetchMessages(mainMessage: Message, remaining: number, result: Message[]= []): Promise<Message[]> {
        return new Promise<Message[]>((resolve, reject) => {

            let innerFetch = (mainMsg: Message, remaining: number, result: Message[], resolve: Function, reject: Function) => {
                let current = remaining > 100 ? 100 : remaining;
                remaining -= current;

                let options: any = { limit: current };
                if(result.length > 0) options.before = result[result.length-1].id

                mainMsg.channel.fetchMessages(options)
                    .then(msgs => {
                        result.push.apply(result, msgs.array())

                        if (remaining == 0) {
                            resolve(result);
                            return;
                        }

                        innerFetch(mainMsg, remaining, result, resolve, reject);
                    });
            };

            innerFetch(mainMessage, remaining, result, resolve, reject);
        });

    }

}