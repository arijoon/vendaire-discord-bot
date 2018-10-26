import { inject, injectable } from 'inversify';
import { TYPES } from '../ioc/types';

import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';
import { createRecursive, getAllFilesRecursive, getAllFoldersRecursive } from '../helpers';

@injectable()
export class FilesService implements IFiles {

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig
  ) { }

  getAllFiles(dir: string, options?: IFileQueryOptions): Promise<string[]> {
    let fullPath = this._config.pathFromRoot(dir);

    return new Promise<string[]>((resolve, reject) => {
      if (options && options.recursive) {
        resolve(getAllFilesRecursive(fullPath));
      } else {
        //LEGACY: Maintain for backwards compatibilit
        fs.readdir(fullPath, (err, items) => {
          if (err) {
            reject(err);
          } else {
            resolve(items);
          }
        });
      }
    });
  }

  getAllFolders(dir: string): Promise<string[]> {
    let fullPath = this._config.pathFromRoot(dir);

    return new Promise<string[]>((resolve, reject) => {
      try {
        const result = getAllFoldersRecursive(fullPath).sort();
        resolve(result);
      } catch (e) {
        reject(e);
      }
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

          if (pattern.test(el)) result.push(el);
        }

        return result;
      });
  }

  saveFile(data: any, dir: string, name?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const fullPath = this._config.pathFromRoot(dir);
      const [time, formatted] = this.readableTimeStamp();
      const prefix = `${time}_${formatted}_`;
      const filename = name
        ? `${prefix}${name}`
        : `${prefix}${this.randomGenerator(8)}.png`

      const filePath = path.join(fullPath, filename)

      createRecursive(fullPath)

      data.pipe(fs.createWriteStream(filePath))
        .on('close', () => resolve(filename))
        .on('error', reject);
    });
  }

  readableTimeStamp(): [number, string] {
    const time = Date.now();
    const formatted = moment(time).format('YYYY-MMM-DD_HH-mm-ss');

    return [time, formatted];
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