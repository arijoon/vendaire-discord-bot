import { inject, injectable } from 'inversify';
import { IFiles } from './../contracts/IFiles';
import { IConfig } from "../contracts/IConfig";
import { TYPES } from "../ioc/types";

import * as fs from 'fs';

@injectable()
export class FilesService implements IFiles {

    constructor(
        @inject(TYPES.IConfig) private _config: IConfig
    ) { }

    /** TODO add caching */
    getAllFiles(dir: string): Promise<string[]> {
        let fullPath = this._config.pathFromRoot(dir);

        return new Promise<string[]>((resolve, reject) => {

            fs.readdir(fullPath, (err, items) => {
                if(err) reject(err);
                else resolve(items);
            })
        });
    }
    
    /** Not implemented yet */
    getAllFilesWithName(dir: string, pattern: string): Promise<string[]> {
        throw new Error('Method not implemented.');
    }


}