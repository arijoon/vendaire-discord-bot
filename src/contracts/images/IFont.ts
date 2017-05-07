export interface IFont {
    getFont(pattern: string): Promise<any>;
}