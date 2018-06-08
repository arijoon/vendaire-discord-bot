import { inject, injectable } from 'inversify';
import { TYPES } from "../ioc/types";

import * as fs from 'fs';

@injectable()
export class Content implements IContent {

    _contentConfig: any;

    constructor(
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(TYPES.ICacheString) private _cache: ICache<string, any>
    ) { 
        this._contentConfig = _config.content;
    }

    getContent(name: string): Promise<string> {
        return new Promise((resolve, reject) => {

            if(this._cache.has(name)) {
                resolve(this._cache.getType<string>(name));
                return;
            }

            if(!this._contentConfig[name]) {
                reject("File not found");
                return;
            }

            let filePath = this._config.pathFromRoot(this._contentConfig.root, this._contentConfig[name]);

            fs.readFile(filePath, 'utf8', (err, data) => {
                if(err) {
                    reject(err);
                    return;
                }

                resolve(data);

                this._cache.set(name, data);
            })
        });
    }


}