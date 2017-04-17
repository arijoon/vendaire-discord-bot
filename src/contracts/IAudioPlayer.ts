import { VoiceChannel } from 'discord.js';

export interface IAudioPlayer {
    playFile(channel: VoiceChannel, filename: string);
    playFromYoutube(channel: VoiceChannel, url: string);
}