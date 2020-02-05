interface IHttp {
    getJson(url: string, headers?: any, cookies?: any): Promise<any>;
    get(url: string, headers?: any, queries?: any): Promise<any>;

    /** Returns a stream that can be piped */
    getFile(url: string): Promise<IHttpFileResult>;

    post(url: string, data, options?): Promise<any>; 

    /**
     * replaces parts of url with parameters, e.g. /rooms/:roomId, must have roomId as a key in params
     * @param {*} url 
     * @param {*} params dictionary of parameters to replace
     */
    path(url, params);
}

interface IHttpFileResult {
  data: any;
  size: number;
  name: string;
}