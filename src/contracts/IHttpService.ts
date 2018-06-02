import { Transform } from "stream";

export interface IHttp {
    getJson(url: string, headers?: any, cookies?: any): Promise<any>;
    get(url: string, headers?: any): Promise<any>;

    /** Returns a stream that can be piped */
    getFile(url: string): Promise<any>;
}