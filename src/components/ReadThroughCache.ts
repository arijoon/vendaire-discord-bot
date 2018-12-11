export class ReadThroughCache<T> implements IReadThroughCache<T> {
  constructor(private _cache: IBasicCache,
    private _populator: (key: string) => Promise<T>,
    private keyGenerator: (key) => string,
    private timeout: number
  ) { }

  async get(rawKey: string): Promise<T> {
    const key = this.keyGenerator(rawKey);
    if(await this._cache.has(key)) {
      const json = await this._cache.get(key);
      return JSON.parse(json) as T;
    }

    const value: T = await this._populator(rawKey);
    this._cache.set(key, JSON.stringify(value), this.timeout);

    return value;
  }
}
