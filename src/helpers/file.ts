import * as fs from 'fs';
import * as path from 'path';

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
 * Get all files recursively in directory and subdirectories
 * @param srcPath source path
 */
export function getAllFilesRecursive(srcPath: string): string[] {
  const items = fs.readdirSync(srcPath);
  const folders = [];
  const files = []

  for (const item of items) {
    if (fs.statSync(path.join(srcPath, item)).isDirectory()) {
      folders.push(item)
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
  const folders = items.filter(item => fs.statSync(path.join(srcPath, item)).isDirectory());
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
    if (fs.statSync(path.join(srcPath, item)).isDirectory()) {
      folders.push(item)
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
