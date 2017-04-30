import { injectable } from 'inversify';
import { IConfig } from './../contracts/IConfig';

import * as path from 'path';

declare let require: any;

@injectable()
export class Config implements IConfig {

    private _root: string;
    private _images: Map<string, string> = new Map<string, string>();

    _secret: any = require('../config.secret.json');
    _appConfig: any = require('../app.config.json');
    _contentConfig: any = require('../content.config.json');
    _apiConfig: any = require('../api.config.json');
    _imagesConfig: any = require('../images.config.json');
    _audiosConfig = require('../audios.config.json');

    constructor() {
        this._root = this._secret.root;
        this._images = this._imagesConfig;


        let env = process.env.NODE_ENV || 'production';
        env = env.trim();

        for (let key in this._appConfig['env'][env]) {
            this._appConfig[key] = this._appConfig['env'][env][key];
        }
    }

    get root(): string {
        return this._root;
    }

    get secret(): any {
        return this._secret;
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
        return this._secret['admin'];
    }

    get app(): any {
        return this._appConfig;
    }

    pathFromRoot(...p: string[]) {
        return path.join(this.root, ...p);
    }
}