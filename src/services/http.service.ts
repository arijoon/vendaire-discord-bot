import { injectable } from 'inversify';
import { IHttp } from "../contracts/IHttpService";
import * as rp from 'request-promise';
import * as http from 'http';
import { Transform } from "stream";

@injectable()
export class HttpService implements IHttp {

    getJson(url: string): Promise<any> {
        let options = {
            uri: url,
            json: true
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