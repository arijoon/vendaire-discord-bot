import { injectable } from 'inversify';
import { IHttp } from "../contracts/IHttpService";
import * as rp from 'request-promise';

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
}