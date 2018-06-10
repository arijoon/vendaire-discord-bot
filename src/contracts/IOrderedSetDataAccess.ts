/**
 * An ordered set that can be accessed via a range in the keys
 */
interface IOrderedSetDataAccess {
  /**
   * Add items to a collection
   * @param setKey the unique key for this collection
   * @param values set of values to insert, keys, must be unique
   */
  addValues(setKey: string, values: IKeyValuePair[]) : Promise<void>;

  /**
   * Get items from a collection by a range key
   * @param setKey the unique key for this collection
   * @param min minimum value for the key
   * @param max maximum value for the key
   * @param limit the upper bound on the number of result set
   */
  getRange(setKey: string, min: number, max: number, limit?: number) : Promise<IKeyValuePair[]>

  /**
   * Remove a range of items
   * @param setKey the unique key for this collection
   * @param min minimum value for the key
   * @param max maximum value for the key
   */
  removeRange(setKey: string, min: number, max: number): Promise<void>
}