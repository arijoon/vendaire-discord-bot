import { injectable } from 'inversify';
import { IConfig } from './../contracts/IConfig';

import * as path from 'path';

declare let require: any;

@injectable()
export class Config implements IConfig {


    private _root: string;
    private _images: string;

    _config: any = require('../config.secret.json');
    _imagesConfig: any = require('../images.config.json');

    constructor() {
        this._root = this._config.root;
        this._images = this._imagesConfig.root;
    }

    get root(): string {
        return this._root;
    }

    get images(): string {
        return this._images;
    }

    pathFromRoot(...p: string[]) {
        return path.join(this.root, ...p);
    }
}