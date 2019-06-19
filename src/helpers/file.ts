import * as fs from 'fs';
import * as path from 'path';
import { commands } from '../static';

/**
 * Recursively creates the directory structure if not exists
 * @param fullPath the path to create in Linux format
 */
export function createRecursive(fullPath: string) {
  const sep = path.sep;
  const initDir = path.isAbsolute(fullPath) ? sep : '';
  const baseDir = sep === '\\' ? '.' : '';
  if (!fs.existsSync(fullPath)) {
    fullPath.split(sep).reduce((total, current) => {
      const newVal = path.join(baseDir, total, current);
      if (!fs.existsSync(newVal)) {
        fs.mkdirSync(newVal);
      }

      return newVal;
    }, initDir);
  }
}

/**
 * In case of dangerous input, it'll throw an exception
 * @param fullPath the path to sanatize
 */
export function checkFolder(fullPath: string) {
  if(fullPath.indexOf('..') > -1) {
    throw new Error("Dangerous user input, aborting");
  }
}

/**
 * Get all files recursively in directory and subdirectories
 * @param srcPath source path
 */
export function getAllFilesRecursive(srcPath: string): string[] {
  const items = fs.readdirSync(srcPath);
  const folders = [];
  const files = []

  for (const item of items) {
    if (isValidDirectory(srcPath, item)) {
      !item.startsWith(".") && folders.push(item);
    } else {
      files.push(item);
    }
  }

  for(let folder of folders) {
     files.push.apply(files, getAllFilesRecursive(path.join(srcPath, folder))
        .map(item => path.join(folder, item)));
  }

  return files;
}

/**
 * Get all folders recursively
 * @param srcPath the source path
 */
export function getAllFoldersRecursive(srcPath: string): string[] {
  const items = fs.readdirSync(srcPath);
  const folders = items.filter(item => isValidDirectory(srcPath, item) && !item.startsWith("."));
  return folders.reduce((total, current) => {
    total.push.apply(total, getAllFoldersRecursive(path.join(srcPath, current))
      .map(item => path.join(current, item)));

      return total;
  }, folders);
}

/**
 * Get a nested structure of folders and files recursively
 * @param srcPath source path
 * @param name name of the parent folder
 */
export function getAllFoldersStatRecursively(srcPath: string, name?: string): IFolderStat {
  const items = fs.readdirSync(srcPath);
  const folders = [];
  const files = []

  for (const item of items) {
    if (isValidDirectory(srcPath, item)) {
      !item.startsWith(".") && folders.push(item);
    } else {
      files.push(item);
    }
  }

  return {
    name: name,
    files: files,
    folders: folders.map(f => getAllFoldersStatRecursively(path.join(srcPath, f), f))
  };
}

/**
 * Get the full dir from images root path
 * @param _config configuration
 * @param subpaths additional subpaths
 */
export function fromImageRoot(_config: IConfig, ...subpaths) {
    return path.join(_config.images["root"], commands.randomPic, ...subpaths);
}

function isValidDirectory(srcPath, item) {
  return fs.statSync(path.join(srcPath, item)).isDirectory();
}


