import { injectable } from 'inversify';
import * as rp from 'request-promise';
import * as request from 'request';
import * as http from 'http';
import URI from 'urijs';
import { Transform } from 'stream';

const tough = require('tough-cookie');

@injectable()
export class HttpService implements IHttp {
    _parentUrl = /(https?:\/\/(www\.)?\w+\.\w+\/?)/

    getJson(url: string, headers?: any, cookies?: any): Promise<any> {
        let options: any = {
            uri: url,
            json: true
        }

        if(headers) {
          options.headers = headers;
        }

        if(cookies) {
          const jar = rp.jar();
          const domain = this._parentUrl.exec(url)[1];
          for(let key in cookies) {
            const cookie = new tough.Cookie({
              key: key,
              value: cookies[key]
            });

            jar.setCookie(cookie, domain);
          }

          options.jar = jar;
        }

        return rp(options);
    }

    get(url: string, headers?: any): Promise<any> {
        let options: any = {
            url: url,
            json: false
        }

        if(headers) {
          options.headers = headers;
        }

        return rp(options);
    }

  getFile(url: string): Promise<IHttpFileResult> {

    return new Promise<any>((resolve, reject) => {
      const fileNameFromUrl = this.fileNameFromUrl;
      request.head(url, function (err, res, _) {
        if (err) reject(err);
        const size = res.headers['content-length'];
        const name = fileNameFromUrl(url);
        resolve({ stream: request(url), name, size });
      });
    });
  }

  fileNameFromUrl(url: string) {
    const components = url.split('/');
    return components[components.length - 1];
  }
}