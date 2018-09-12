import * as Fuse from 'fuse.js';
/**
 * Make a Searcher instance to support fuzzy search
 * @param items M
 * @param options 
 */
function make(items: any[], options: any): ISearcher {
  const fuse: any = new Fuse(items, options);

  return fuse as ISearcher;
}