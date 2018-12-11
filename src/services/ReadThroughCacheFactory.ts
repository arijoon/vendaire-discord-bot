import { ReadThroughCache } from './../components/ReadThroughCache';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';

const defaultExpiry = 60 * 60; // 1hour

@injectable()
export class ReadThroughCacheFactory {
  constructor(
    @inject(TYPES.IBasicCache) private _cache: IBasicCache,
  ) { }

  makeCache<T>(populator: (key: string) => Promise<T>,
    keyMaker: (key: string) => string = defaultKeyGenerator,
    timeout: number = defaultExpiry
  ): IReadThroughCache<T> {
    return new ReadThroughCache(this._cache, populator, keyMaker, timeout);
  }
}

function defaultKeyGenerator(key: string): string {
  return `READTHROUGH:${key}`;
}