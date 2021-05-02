interface IFiles {
  getAllFiles(dir: string, options?: IFileQueryOptions): Promise<string[]>;

  /**
   * get all folders recursively
   * @param dir directory relative to project root
   */
  getAllFolders(dir: string): Promise<string[]>;

  /**
   * get a nested folder statistics structure
   * @param dir directory relative to project root
   * @param name name of the parent folder
   */
  getAllFoldersStat(dir: string, name: string): Promise<IFolderStat>;

  /** Saves and returns the filename, data must have pipe, if string it'll write the data into a file 
   * @param data, must be a Readable stream
  */
  saveFile(data: any, dir: string, name?: string, prefixTime?: boolean): Promise<string>;

  /**
   * remove a remporary file, resolves empty promise if null path
   * @param filePath full file path
   */
  removeTmpFile(filePath: string): Promise<void>;

  /**
   *  Writes a file to temporary folder and returns the full file path 
   * @param data, must be a Readable stream
   * @param ext file name extension, e.g. `.jpg`
   */
  writeTmpFile(data: any, ext: string): Promise<string>;

  /**
   * Read a file content and return them as string
   * @param filePath full path to the file
   * @param isFromRoot is the file from root (absolute)
   */
  readFile(filePath: string, isFromRoot?: boolean): Promise<string>;

  /**
   * create a readstream over a file
   * @param filePath full file path
   */
  readStream(filePath: string): Promise<any>

  /**
   * Read a file and return a buffer
   * @param filePath path to the file
   * @param options options to determine the rea actions
   */
  readFileBuffer(filePath: string, options?: IFileReadOptions): Promise<Buffer>;

  getRandomFile(dir: string): Promise<string>;

  getAllFilesWithName(dir: string, pattern: RegExp): Promise<string[]>;
}

interface IFileQueryOptions {
  recursive?: boolean;
  include?: RegExp;
}

interface IFolderStat {
  name: string;
  files: string[];
  folders: IFolderStat[];
}

interface IFileReadOptions {
  isAbsolute?: boolean
}