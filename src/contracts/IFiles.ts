export interface IFiles {
    getAllFiles(dir: string): Promise<string[]>;

    getAllFilesWithName(dir: string, pattern: string): Promise<string[]>;
}