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