export interface IConfig {

    root: string;
    images: Map<string, string>;
    api: Map<string, string>;

    pathFromRoot(...path: string[]): string;
}