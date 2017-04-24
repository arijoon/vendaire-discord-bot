import { IClient } from '../contracts/IClient';
import { inject } from 'inversify';
import { ICommand } from '../contracts/ICommand';
import { injectable } from 'inversify';
import { commands } from "../static/commands";
import { TYPES } from "../ioc/types";
import { commonRegex } from "../helpers/common-regex";

@injectable()
export class RateCommand implements ICommand {

    readonly _command: string = commands.rate;

    readonly _chances = {
        1: "would not touch with a stick",
        2: "would not touch",
        9: "would like to decimate",
        10: "would absolutely decimate uncontrollably"
    };
    
    constructor(
        @inject(TYPES.IClient) private _client: IClient
    ) { }

    attach(): void {
        this._client
            .getCommandStream(this._command)
            .subscribe(imsg => {
                const msg = imsg.Message;

                let roll = this.getRoll(3);

                let result: string;

                if(commonRegex.link.test(msg.content.trim())) {
                    result = `${msg.content}\nThis is ${roll}/10 `
                } else {
                    result = `${msg.content} is ${roll}/10 `
                }

                if(this._chances[roll])
                    result += this._chances[roll]

                msg.channel.sendMessage(result)
                .then(() => imsg.done());
            });
    }

    getRoll(tries: number): number {
        let highest = 0;
        for(let i = 0; i < tries; i++) {
            let roll = Math.floor(Math.random()*10);

            if(roll > highest) highest = roll
        }

        return highest;
    }
}