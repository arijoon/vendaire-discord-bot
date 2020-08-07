export interface IFont {
  /**
   * Get a jimp font
   * @param pattern a pattern to look for in a font filename
   */
  getFont(pattern: string): Promise<any>;

  /**
   * Get full path to a font file
   * @param filename font filename 
   */
  getFontFile(filename: string): string;
}