export interface IConfig {

    root: string;
    admin: string;
    images: Map<string, string>;
    api: Map<string, string>;
    audios: any;
    secret: any;
    content: any;
    app: any;

    pathFromRoot(...path: string[]): string;
}