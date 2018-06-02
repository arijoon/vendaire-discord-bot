import { ICache } from '../contracts/ICache';
import { inject, injectable } from 'inversify';
import { IFiles } from './../contracts/IFiles';
import { IConfig } from "../contracts/IConfig";
import { TYPES } from "../ioc/types";

import * as fs from 'fs';
import * as path from 'path';
import { Transform } from 'stream';

@injectable()
export class FilesService implements IFiles {

    constructor(
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(TYPES.ICacheString) private _cache: ICache<string, any>
    ) { }

    getAllFiles(dir: string): Promise<string[]> {
        let fullPath = this._config.pathFromRoot(dir);

        return new Promise<string[]>((resolve, reject) => {

            if(this._cache.has(fullPath)) {
                resolve(this._cache.getType<string[]>(fullPath));
            }

            fs.readdir(fullPath, (err, items) => {
                if(err) {
                     reject(err);
                } else {
                     resolve(items);
                     this._cache.set(fullPath, items);
                }
            })
        });
    }

    getRandomFile(dir: string): Promise<string> {
        return this.getAllFiles(dir).then(f => f.crandom());
    }

    getAllFilesWithName(dir: string, pattern: RegExp): Promise<string[]> {

        return this.getAllFiles(dir)
            .then(lst => {
                let result = [];

                for (var i = 0; i < lst.length; i++) {
                    var el = lst[i]

                    if(pattern.test(el)) result.push(el);
                }

                return result;
            });
    }

  saveFile(data: any, dir: string, name?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const fullPath = this._config.pathFromRoot(dir);
      const filename = name 
      ? `${Date.now()}_${name}` 
      : `${Date.now()}_${this.randomGenerator(8)}.png`

      const filePath = path.join(fullPath, filename)

      data.pipe(fs.createWriteStream(filePath))
      .on('close', () => resolve(filename))
      .on('error', reject);
    });
  }

  randomGenerator(length: number): string {
    const options = "QWERTYUIOPASDFFGHJKLZXCVBNM".split('');
    let result = "";
    for (let i = 0; i < length; i++) {
      result += options.crandom();
    }

    return result;
  }
}