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

export function getAllFoldersRecursive(srcPath: string): string[] {
  const items = fs.readdirSync(srcPath);
  const folders = items.filter(item => fs.statSync(path.join(srcPath, item)).isDirectory());
  return folders.reduce((total, current) => {
    total.push.apply(total, getAllFoldersRecursive(path.join(srcPath, current))
      .map(item => path.join(current, item)));

      return total;
  }, folders);
}
