interface IFiles {
    getAllFiles(dir: string, options?: IFileQueryOptions): Promise<string[]>;

    /**
     * get all folders recursively
     * @param dir directory relative to project root
     */
    getAllFolders(dir: string): Promise<string[]>;

    /** Saves and returns the filename, data must have pipe */
    saveFile(data: any, dir: string, name?: string): Promise<string>; 

    getRandomFile(dir: string): Promise<string>;

    getAllFilesWithName(dir: string, pattern: RegExp): Promise<string[]>;
}

interface IFileQueryOptions {
  recursive?: boolean;
}