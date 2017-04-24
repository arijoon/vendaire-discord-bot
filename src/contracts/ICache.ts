export interface ICache<TKey, TVal> {

    Cache: Map<TKey, TVal>;

    has(key: TKey);
    get(key: TKey);
    set(key: TKey, val: TVal);
}
