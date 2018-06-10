export class StubOrderedSetDataAccess implements IOrderedSetDataAccess {
  private _collection: { [key: number]: string } = {};

  addValues(_: string, values: IKeyValuePair[]): Promise<void> {
    return Promise.resolve().then(_ => {
      for (let i of values) {
        this._collection[i.key] = i.value;
      }
    });
  }

  getRange(_: string, min: number, max: number, limit?: number): Promise<IKeyValuePair[]> {
    return Promise.resolve().then(_ => {
      const result: IKeyValuePair[] = [];
      for (let key in this._collection) {
        const item = this._collection[key];

        const numkey = +key;
        if (numkey > min && numkey < max) {
          result.push({ key: numkey, value: item })
        }

        if(limit && result.length >= limit) {
          break;
        }
      }

      return result;
    });
  }

  removeRange(setKey: string, min: number, max: number): Promise<void> {
    return Promise.resolve().then(_ => {
      delete this._collection[min];
      delete this._collection[max];
    });
  }
}