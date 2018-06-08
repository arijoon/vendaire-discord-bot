import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';

@injectable()
export class InMemoryCache implements ICache<string, any> {

    _cache: Map<string, any>;

    _enabled: boolean;

    constructor(
        @inject(TYPES.IConfig) config: IConfig
    ) {
        this._cache = new Map<string, any>();
        this._enabled = config.app.cache;
    }

    has(key: string): boolean {
        if(!this._enabled) return false;

        return this._cache.has(key);
    }

    get(key: string): any {
        return this._cache.get(key);
    }

    set(key: string, val: any): void {
        if(!this._enabled) return;

        this._cache.set(key, val);
    }

    getType<T>(key: string): T {
        return this.get(key) as T;
    }
}
