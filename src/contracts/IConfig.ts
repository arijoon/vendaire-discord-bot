export interface IConfig {

    root: string;
    images: string;

    pathFromRoot(...path: string[]): string;
}