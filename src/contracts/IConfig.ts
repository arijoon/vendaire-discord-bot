export interface IConfig {

    root: string;
    images: Map<string, string>;
    api: Map<string, string>;
    audios: any;
    config: any;
    content: any;

    pathFromRoot(...path: string[]): string;
}