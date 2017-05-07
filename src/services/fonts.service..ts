import { IFont } from './../contracts/images/IFont';
import { ICache } from '../contracts/ICache';
import { inject, injectable } from 'inversify';
import { IFiles } from './../contracts/IFiles';
import { IConfig } from "../contracts/IConfig";
import { TYPES } from "../ioc/types";

const jimp = require('jimp');

@injectable()
export class FontService implements IFont {

    constructor(
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(TYPES.IFiles) private _files: IFiles,
        @inject(TYPES.ICacheString) private _cache: ICache<string, any>
    ) { }

    getFont(pattern: string): Promise<any> {

        if (this._cache.has(pattern))
            return new Promise<any>(resolve => resolve(this._cache.get(pattern)));

        let patternReg = new RegExp(pattern);

        let dir = this._config.pathFromRoot(this._config.app.assets, 'fonts');

        return this._files.getAllFilesWithName(dir, patternReg)
            .then(res => {
                if (res.length < 1)
                    throw new Error(`font ${pattern} not found`);

                let path = this._config.pathFromRoot(this._config.app.assets, 'fonts', res[0]);

                return jimp.loadFont(path).then(font => {
                    this._cache.set(pattern, font);

                    return font;
                });
            })
    }
}