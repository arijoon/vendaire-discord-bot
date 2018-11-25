interface ICache<TKey, TVal> {
    has(key: TKey): boolean;
    get(key: TKey): TVal;
    set(key: TKey, val: TVal): void;

    getType<T>(key: TKey): T;
}

interface IBasicCache {
    has(key: string): Promise<boolean>;
    get(key: string): Promise<string>;
    set(key: string, val: string, expiryInSeconds?: number): Promise<void>;
    remove(key: string): Promise<void>;
}
