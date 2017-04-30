import { IConfig } from './../contracts/IConfig';
import { injectable, inject } from 'inversify';
import { ICache } from './../contracts/ICache';
import { TYPES } from "../ioc/types";

@injectable()
export class CacheString implements ICache<string, any> {

    Cache: Map<string, any>;

    _enabled: boolean;

    constructor(
        @inject(TYPES.IConfig) private _config: IConfig
    ) {
        this.Cache = new Map<string, any>();
        this._enabled = _config.secret.cache;
    }

    has(key: string): boolean {
        if(!this._enabled) return false;

        return this.Cache.has(key);
    }

    get(key: string): any {
        return this.Cache.get(key);
    }

    set(key: string, val: any): void {
        if(!this._enabled) return;

        this.Cache.set(key, val);
    }

    getType<T>(key: string): T {
        return this.get(key) as T;
    }
}
