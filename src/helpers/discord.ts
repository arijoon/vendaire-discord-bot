import { IMessage } from "../contracts";
import { commonRegex, getAll } from './common-regex';

/**
 * Returns a user mention string
 * @param userId userId
 */
export function mention(userId: string): string {
  return `<@${userId}>`
}

const linkableUrls = [
  /https:\/\/streamable.com/,
  /https?:\/\/[a-z\.]*imgur.com/
];
/**
 * Whether the url is stored as link files 
 */
export function shouldSaveAsLink(url: string) {
  for (let item of linkableUrls) {
    if (item.test(url)) {
      return true;
    }
  }

  return false;
}

/**
 * Get url from current message or previous 10
 */
export async function getUrlFromCurrentOrFromHistory(imsg: IMessage) {
  try {
    return getUrl(imsg);
  } catch (_) {
    // Current message has none, search in history:
    const msgs = await imsg.fetchFullMessages({ limit: 10 });

    for (let msg of msgs) {
      try { // TODO very ugly, refactor asap
        return getUrl(msg);
      } catch (_) { }
    }
  }
  throw new Error("No Attachments or links found");
}

/**
 * If message has any urls, extract that, otherwise get the attachments
 */
export function getUrl(imsg: IMessage) {
  const urls = getAll(imsg.Content, commonRegex.allLinks);

  if (urls && urls.length > 0) {
    return urls[0];
  }

  if (imsg.Message.attachments.size < 1) {
    throw new Error("No Attachments or links found");
  }
  const attachment = imsg.Message.attachments.first();

  return attachment.url;
}