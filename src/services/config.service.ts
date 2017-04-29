import { injectable } from 'inversify';
import { IConfig } from './../contracts/IConfig';

import * as path from 'path';

declare let require: any;

@injectable()
export class Config implements IConfig {


    private _root: string;
    private _images: Map<string, string> = new Map<string, string>();

    _config: any = require('../config.secret.json');
    _contentConfig: any = require('../content.config.json');
    _apiConfig: any = require('../api.config.json');
    _imagesConfig: any = require('../images.config.json');
    _audiosConfig = require('../audios.config.json');

    constructor() {
        this._root = this._config.root;
        this._images = this._imagesConfig;
    }

    get root(): string {
        return this._root;
    }

    get config(): any {
        return this._config;
    }

    get images(): Map<string, string> {
        return this._images;
    }

    get api(): Map<string, string> {
        return this._apiConfig;
    }

    get audios(): any {
        return this._audiosConfig;
    }

    get content(): any {
        return this._contentConfig;
    }

    get admin(): string {
        return this._config['admin'];
    }

    pathFromRoot(...p: string[]) {
        return path.join(this.root, ...p);
    }
}