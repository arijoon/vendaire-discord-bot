interface IFiles {
    getAllFiles(dir: string, options?: IFileQueryOptions): Promise<string[]>;

    /** Saves and returns the filename, data must have pipe */
    saveFile(data: any, dir: string, name?: string): Promise<string>; 

    getRandomFile(dir: string): Promise<string>;

    getAllFilesWithName(dir: string, pattern: RegExp): Promise<string[]>;
}

interface IFileQueryOptions {
  recursive?: boolean;
}