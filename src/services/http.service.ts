import { injectable } from 'inversify';
import { IHttp } from "../contracts/IHttpService";
import * as rp from 'request-promise';
import * as http from 'http';
import URI from 'urijs';
import { Transform } from "stream";

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
          const cookie = new tough.Cookie(cookies);
          const jar = rp.jar();
          const domain = this._parentUrl.exec(url)[1];
          jar.setCookie(cookie, domain);

          options.jar = jar;
        }

        return rp(options);
    }

    get(url: string): Promise<any> {
        let options = {
            url: url,
            json: false
        }

        return rp(options);
    }
    getFile(url: string): Promise<Transform> {

        return new Promise<any>((resolve, reject) => {
            http.request(url, function (response) {
                var data = new Transform();

                response.on('data', function (chunk) {
                    data.push(chunk);
                });

                response.on('error', function (err) {
                    reject(err);
                });

                response.on('end', function () {
                    resolve(data);
                });
            });
        });
    }
}