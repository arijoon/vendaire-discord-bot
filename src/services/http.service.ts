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

  getFile(url: string): Promise<any> {

    return new Promise<any>((resolve, reject) => {
      request.head(url, function (err, res, body) {
        resolve(request(url));
      });
      //   const options = {
      //     port: 80,
      //     path: url
      //   };

      //   http.request(options, function (response) {
      //     var data = new Transform();

      //     response.on('data', function (chunk) {
      //       data.push(chunk);
      //     });

      //     response.on('error', function (err) {
      //       reject(err);
      //     });

      //     response.on('end', function () {
      //       resolve(data);
      //     });
      //   });
    });
  }
}