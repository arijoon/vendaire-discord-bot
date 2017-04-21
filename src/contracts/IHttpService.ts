export interface IHttp {
    getJson(url: string): Promise<any>;
}