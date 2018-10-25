import * as fs from 'fs';
import * as path from 'path';

/**
 * Recursively creates the directory structure if not exists
 * @param fullPath the path to create in Linux format
 */
export function createRecursive(fullPath: string) {
  const sep = path.sep;
  const initDir = path.isAbsolute(fullPath) ? sep : '';
  const baseDir = '.';
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
