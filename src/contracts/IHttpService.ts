export interface IHttp {
    getJson(url: string, headers?: any, cookies?: any): Promise<any>;
    get(url: string): Promise<any>;
    getFile(url: string): Promise<any>;
}