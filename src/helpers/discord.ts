/**
 * Returns a user mention string
 * @param userId userId
 */
export function mention(userId: string): string {
  return `<@${userId}>`
}