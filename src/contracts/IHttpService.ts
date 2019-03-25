interface IHttp {
    getJson(url: string, headers?: any, cookies?: any): Promise<any>;
    get(url: string, headers?: any, queries?: any): Promise<any>;

    /** Returns a stream that can be piped */
    getFile(url: string): Promise<IHttpFileResult>;
}

interface IHttpFileResult {
  data: any;
  size: number;
  name: string;
}