export interface IConfig {

    root: string;
    images: Map<string, string>;
    api: Map<string, string>;
    config: any;

    pathFromRoot(...path: string[]): string;
}