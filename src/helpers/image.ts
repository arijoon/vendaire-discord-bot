import { exec as e } from 'child_process';
const util = require('util');
const fs = require('fs');
const exec = util.promisify(e);

/**
 * converts a png or bmp file to jpg
 * @param filePath absolute path to the file
 */
export async function toJpg(filePath: string) {
  if (filePath.endsWith(".png") || filePath.endsWith(".bmp")) {
    const newPath = nameToJpg(filePath);
    await exec(`magick "${filePath}" "${newPath}"`);
    fs.unlinkSync(filePath);

    return newPath;
  }

  return filePath;
}

export function nameToJpg(filename) {
    return filename.replace(/\.(png)|(bmp)^/, ".jpg");
}

export async function optimize(filePath: string, logger: ILogger, size: number = 3000) {
  filePath = await toJpg(filePath);
  const {stdout, stderr} = await exec(`jpegoptim --preserve --strip-all --verbose --size=${size} "${filePath}"`);

  logger.info(stdout);
  if (stderr)
    logger.error(stderr);

  return filePath;
}

/**
 * Calculates a new set of sizes based on a maximum height
 * @param width width
 * @param height height
 * @param maxHeight maximum height
 * @returns [newWidth, newHeight]
 */
export function calculateSize(width, height, maxHeight): [number, number] {
  if (height <= maxHeight)
    return [width, height];

  const newWidth = width / (height/maxHeight);

  return [newWidth, maxHeight];
}