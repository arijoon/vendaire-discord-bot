export interface IContent {
    getContent(name: string): Promise<string>;
}