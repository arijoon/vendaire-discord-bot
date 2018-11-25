import { VoiceChannel } from 'discord.js';

export interface IAudioPlayer {
    /** Play a random file */
    playRandomFile(channel: VoiceChannel, query?: string, folderName?: string): Promise<void>;

    /** Play the filename */
    playFile(channel: VoiceChannel, filename: string);

    /** Play the audio from youtube link */
    playFromYoutube(channel: VoiceChannel, url: string);
}