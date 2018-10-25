export const commonRegex = {
    link: /(https?:\/\/\S+)/,
    allLinks: /(https?:\/\/\S+)/g,
    usermention: /<@\d+>/
}

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
