import { IMessage } from './IMessage';

export interface IAudioPlayer {
  /** Play a random file */
  playRandomFile(imsg: IMessage, query?: string, folderName?: string, channelId?: string): Promise<void>;

  /** Play the filename */
  playFile(imsg: IMessage, filename: string): Promise<void>;

  /** Play the audio from youtube link */
  playFromYoutube(imsg: IMessage, url: string);
}