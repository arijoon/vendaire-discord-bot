export const commonRegex = {
    link: /(https?:\/\/\S+)/,
    allLinks: /(https?:\/\/\S+)/g,
    usermention: /<@\d+>/
}

/**
 * Get all matches from content
 * @param content content string to search in
 * @param reg Regex to use for searching
 * @param group Regex group to extract
 */
export function getAll(content: string, reg: RegExp, group: number = 0) {
  reg = new RegExp(reg);
  const results: string[] = [];
  let matches: RegExpExecArray = null
  while (matches = reg.exec(content)) {
    if (matches && matches.length > group) {
      results.push(matches[group]);
    }
  }

  return results.length > 0
    ? results
    : null;
}
