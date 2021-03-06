import { inject, injectable, optional } from 'inversify';
import { TYPES } from '../ioc/types';

@injectable()
export class FileServerApi {

  readonly baseUrl: string;

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IHttp) private _http: IHttp
  ) {
    this.baseUrl = _config.api["fileServer"];
  }

  searchHash(hash) {
    const url = this.url("/items/search/:hash");
    return this.get(url, {hash})
  }

  searchFolder(query) {
    const url = this.url("/items/path-search/:query");
    return this.get(url, {query})
  }

  reHash(path) {
    const url = this.url("/items/hash_dir");
    return this.post(url, {path});
  }

  newFile({filename, path, folder}) {
    const url = this.url("/items");

    return this.post(url, {filename, path, folder});
  }

  randomFile(paths: string[]) {
    const url = this.url("/items/rand-search/:query");
    const args = this.transformPaths(paths)
    return this.get(url, { query: this.transformPaths(paths) })
  }

  stats(paths: string[]) {
    const url = this.url("/items/stats");

    return this.post(url, { path: this.transformPaths(paths) })
  }

  delete(args) {
    const url = this.url("/items/delete");

    return this.post(url, args)
  }

  private transformPaths(paths: string[]): string {
    return paths
      .filter(p => p)
      .map(p => p.trim())
      .join(",")
  }

  private url(url) {
    return `${this.baseUrl}/api${url}`
  }

  private post(url, payload) {
    return this._http.post(url, payload, { headers: this.headers()})
  }

  private get(url, params?) {
    if (params) {
      url = this._http.path(url, params);
    }
    return this._http.getJson(url, this.headers())
  }

  private parse(resp) {
    return resp.json()
    .then(json => {
      if (!resp.ok) {
        return Promise.reject(json)
      }

      return json;
    });
  }
  
  private headers() {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }
}