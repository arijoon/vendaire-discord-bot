export interface ICache<TKey, TVal> {

    Cache: Map<TKey, TVal>;

    has(key: TKey): boolean;
    get(key: TKey): TVal;
    set(key: TKey, val: TVal): void;

    getType<T>(key: TKey): T;
}
