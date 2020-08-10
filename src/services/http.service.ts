import { injectable } from 'inversify';
import * as rp from 'request-promise';
import * as request from 'request';

const tough = require('tough-cookie');

@injectable()
export class HttpService implements IHttp {
    _parentUrl = /(https?:\/\/(www\.)?\w+\.\w+\/?)/

    post(url: string, data, options = {}): Promise<any> {
      const opts: any = {
        json: true,
        ...options,
        method: 'POST',
        uri: url,
        body: data,
      };

      return rp(opts);
    }

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

    get(url: string, headers?: any, queries?: any): Promise<any> {
        let options: any = {
            url: url,
            json: false
        }

        if (queries) {
          options.qs = queries;
        }

        if(headers) {
          options.headers = headers;
        }

        return rp(options);
    }

  getFile(url: string): Promise<IHttpFileResult> {

    return new Promise<any>((resolve, reject) => {
      request.head(url, (err, res, _) => {
        if (err) reject(err);
        const size = res.headers['content-length'];
        const name = this.fileNameFromUrl(url, res.headers);
        resolve({ data: request(url), name, size });
      });
    });
  }

  path(url, params) {
    for (let key in params) {
      if (!params.hasOwnProperty(key)) continue;
      url = url.replace(':' + key, encodeURIComponent(params[key]))
    }

    return url;
  }

  fileNameFromUrl(url: string, headers) {
    const components = url.split('/');
    const filename = components[components.length - 1]
      .split('?')[0];

    return filename.includes('.') 
    ? filename 
    : `${filename}.${this.extensionFromContentType(headers)}`;

  }

  extensionFromContentType(headers) {
    const contentType = headers['content-type'];
    const subType: string = contentType.split('/')[1];

    if (subType.includes('-')) {
      const parts = subType.split('-')
      return parts[parts.length - 1];
    } 

    return subType;
  }
}