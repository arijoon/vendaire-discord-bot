export interface IFiles {
    getAllFiles(dir: string): Promise<string[]>;

    getRandomFile(dir: string): Promise<string>;

    getAllFilesWithName(dir: string, pattern: RegExp): Promise<string[]>;
}