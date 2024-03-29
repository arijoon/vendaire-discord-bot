import { inject, injectable } from 'inversify';
import { TYPES } from '../ioc/types';

import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';
import { createRecursive, getAllFilesRecursive, getAllFoldersRecursive, getAllFoldersStatRecursively, isString } from '../helpers';
import { Readable } from 'stream';

@injectable()
export class FilesService implements IFiles {

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger
  ) { }

  getAllFiles(dir: string, options?: IFileQueryOptions): Promise<string[]> {
    let fullPath = this._config.pathFromRoot(dir);

    return new Promise<string[]>((resolve, reject) => {
      if (options && options.recursive) {
        let files = getAllFilesRecursive(fullPath);
        
        if (options.include) {
          files = files.filter(f => f.match(options.include));
        }

        resolve(files);
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

  getAllFoldersStat(dir: string, name: string): Promise<IFolderStat> {
    let fullPath = this._config.pathFromRoot(dir);

    return new Promise<IFolderStat>((resolve, reject) => {
      try {
        const result = getAllFoldersStatRecursively(fullPath);
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

  readFile(filePath: string, isFromRoot = true): Promise<string> {
    if (!isFromRoot)
      filePath = this._config.pathFromRoot(filePath);

    return new Promise((resolve, reject) => {
      fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  readStream(filePath: string): Promise<Readable> {
    return new Promise((resolve, reject) => {
      const readble: Readable = fs.createReadStream(filePath);

      readble.on('open', () => {
        resolve(readble);
      });

      readble.on('error', (err) => {
        reject(err);
      });
    })
  }

  readFileBuffer(filePath: string, options?: IFileReadOptions): Promise<Buffer> {
    const fullPath = this.getFullPath(filePath, options);

    return new Promise((resolve, reject) => {
      fs.readFile(fullPath, null, (err, data) => {
        if (err)
          reject(err);
        else
          resolve(data);
      });
    });
  }

  async removeTmpFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!filePath) {
        resolve();
        return;
      }

      fs.unlink(filePath, (err) => {
        if (err) reject(err);
        else {
          resolve();
          this._logger.info(`Removed temporary file ${filePath}`)
        }
      })
    })
  }

  async writeTmpFile(data: Readable, ext: string): Promise<string> {
    const dir = this._config.app.assets.tmp;
    const filename = `${this.randomGenerator(8)}_${ext}`

    return this.saveFile(data, dir, filename)
    .then(name => {
      this._logger.info(`Created temporary file ${name}`)
      return path.join(this._config.pathFromRoot(dir), name);
    });
  }

  saveFile(data: Readable, dir: string, name?: string, prefixTime: boolean = true): Promise<string> {
    return new Promise((resolve, reject) => {
      const fullPath = this._config.pathFromRoot(dir)
      const [time, formatted] = this.readableTimeStamp();
      const prefix = prefixTime ? `${time}_${formatted}_` : ""
      const filename = name
        ? `${prefix}${name}`
        : `${prefix}${this.randomGenerator(8)}.png`

      const filePath = path.join(fullPath, filename)

      createRecursive(fullPath)

      const writeStream = fs.createWriteStream(filePath)
      data.pipe(writeStream)
        .on('close', () => resolve(filename))
        .on('error', reject)
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

  private getFullPath(filePath: string, ops: IFileReadOptions) {
    if (ops && ops.isAbsolute) {
      return filePath;
    }
    return this._config.pathFromRoot(filePath);
  }
}
