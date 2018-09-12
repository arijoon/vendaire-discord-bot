import * as Fuse from 'fuse.js';
import { ISearcher } from '../contracts';

export { makeSearcher }

/**
 * Make a Searcher instance to support fuzzy search
 * @param items M
 * @param options 
 */
function makeSearcher(items: any[], options: any): ISearcher {
  const fuse: any = new Fuse(items, options);

  return fuse as ISearcher;
}