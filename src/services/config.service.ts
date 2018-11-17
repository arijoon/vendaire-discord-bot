import { injectable } from 'inversify';

import * as path from 'path';

declare let require: any;

@injectable()
export class Config implements IConfig {

  private _isDev: boolean;
  private _env: string;
  private _root: string;
  private _images: Map<string, string> = new Map<string, string>();

  _secret: any = require('../config.secret.json');
  _appConfig: any = require('../app.config.json');

  constructor() {
    this._root = this._secret.root;
    this._images = this._appConfig.assets.images;


    let env = process.env.NODE_ENV || 'production';
    env = env.trim();
    this._env = env;
    this._isDev = env !== 'production';

    for (let key in this._appConfig['env'][env]) {
      this._appConfig[key] = this._appConfig['env'][env][key];
    }

    this._appConfig = this.mergeCollections(process.env, this.mergeDeep(this._appConfig, this._secret), "DiscordBot");
  }

  get isDev(): boolean {
    return this._isDev;
  }

  get env(): string {
    return this._env;
  }

  get root(): string {
    return this._root;
  }

  get images(): Map<string, string> {
    return this._images;
  }

  get api(): Map<string, string> {
    return this._appConfig.api;
  }

  get content(): any {
    return this._appConfig.assets.content;
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

  mergeCollections(envCollection: any, existingCollection: any, prefixKey: string): any {
    const result = { ...existingCollection };
    prefixKey = prefixKey;

    for (let key in envCollection) {
      if (!key.startsWith(prefixKey))
        continue;

      // Merge these keys, using _ for seperation levels
      const keyChain = key.split('_');
      keyChain.shift();

      if (keyChain.length < 1) continue;

      this.mergeKeys(keyChain, result, envCollection[key]);
    }

    return result;
  }

  mergeKeys(keys: string[], collection: any, value: any) {
    // base case
    if (keys.length == 1) {
      collection[keys[0]] = value;
      return;
    }

    const type = typeof collection[keys[0]];

    if (type === "undefined") {
      collection[keys[0]] = {};
    }

    const newCollection = collection[keys[0]];
    keys.shift();
    this.mergeKeys(keys, newCollection, value);
  }

  isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  /**
   * Merge objects deep, source values will overwrite target
   */
  mergeDeep(target, source) {
    let output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target))
            Object.assign(output, { [key]: source[key] });
          else
            output[key] = this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }
}