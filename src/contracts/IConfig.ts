interface IConfig {

    root: string;
    admin: string;
    images: Map<string, string>;
    api: Map<string, string>;
    content: any;
    app: any;

    pathFromRoot(...path: string[]): string;
}