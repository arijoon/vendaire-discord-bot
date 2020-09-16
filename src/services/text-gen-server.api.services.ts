import { inject, injectable, optional } from 'inversify';
import { TYPES } from '../ioc/types';

@injectable()
export class TextGenApi implements IDependency {

  readonly baseUrl: string;

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IHttp) private _http: IHttp
  ) {
    this.baseUrl = _config.api["textgenServer"];
  }

  getName() {
    return TextGenApi.name;
  }

  poll() {
    const url = this.url("/poll");
    return this.get(url)
  }

  genText(str) {
    const url = this.url("/gen");
    return this.get(url, {starting_str: str})
  }

  private url(url) {
    return `${this.baseUrl}${url}`
  }

  private get(url, params?) {
    return this._http.get(url, this.headers(), params)
  }

  private headers() {
    return { }
  }
}