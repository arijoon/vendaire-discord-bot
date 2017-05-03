export interface IHttp {
    getJson(url: string): Promise<any>;
    get(url: string): Promise<any>;
    getFile(url: string): Promise<any>;
}