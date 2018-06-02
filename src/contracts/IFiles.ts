import { Transform } from "stream";

export interface IFiles {
    getAllFiles(dir: string): Promise<string[]>;

    /** Saves and returns the filename, data must have pipe */
    saveFile(data: any, dir: string, name?: string): Promise<string>; 

    getRandomFile(dir: string): Promise<string>;

    getAllFilesWithName(dir: string, pattern: RegExp): Promise<string[]>;
}