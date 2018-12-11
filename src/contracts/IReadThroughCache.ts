interface IReadThroughCache<T> {
  get(rawKey: string): Promise<T>;
}