/**
 * Get the main content
 * @param ops : argv from Optimist option parser
 */
export function getMainContent(ops) {
  return (ops._ && ops._.length > 0 ? ops._.join(" ").trim() : "");
}
