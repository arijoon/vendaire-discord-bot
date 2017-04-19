import { inject, injectable } from 'inversify';
import { IContent } from './../contracts/IContent';
import { TYPES } from "../ioc/types";
import { IConfig } from "../contracts/IConfig";

import * as fs from 'fs';

declare let require: any;

@injectable()
export class Content implements IContent {

    contentConfig: any = require('../content.config.json');

    constructor(
        @inject(TYPES.IConfig) private _config: IConfig
    ) { }

    getContent(name: string): Promise<string> {
        return new Promise((resolve, reject) => {
            if(!this.contentConfig[name]) {
                reject("File not found");
                return;
            }

            let filePath = this._config.pathFromRoot(this.contentConfig.root, this.contentConfig[name]);

            fs.readFile(filePath, 'utf8', (err, data) => {
                if(err) {
                    reject(err);
                    return;
                }

                resolve(data);
            })
        });
    }


}