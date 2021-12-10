/**
 * returns the last section of the url
 * @param url the url
 */
export function getLastSection(url: string) {
  const sections = url.split('/');

  if (sections.length > 0) {
    return sections[sections.length - 1];
  }

  return "";
}

/**
 * gets the domain
 * @param url the url
 */
export function getDomain(url: string) {
  const sections = url
  .replace(/https?:\/\/?/, '')
  .split(/[:\/]/);

  if (sections.length > 0) {
    return sections[0];
  }

  return "";
}