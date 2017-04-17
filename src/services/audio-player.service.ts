import { injectable } from 'inversify';
import { IAudioPlayer } from './../contracts/IAudioPlayer';
import { VoiceChannel } from 'discord.js';

import * as path from 'path';
import * as fs from "fs";

@injectable()
export class AudioPlayerService implements IAudioPlayer {

    ytdl: any;
    audios = require('../audios.config.json');

    playFromYoutube(channel: VoiceChannel, url: string) {
        if(!channel || !url) return;

        if (!this.ytdl) {
            this.ytdl = require('ytdl-core')
        }

        channel.join().then(con => {

            let stream = this.ytdl(url, { filter: 'audioonly' });
            const listener = con.playStream(stream);

            listener.on('end', () => con.disconnect());
            listener.once('error', (err) => con.disconnect());
        }).catch(err => {
            console.error(err);
        })
    }

    playFile(channel: VoiceChannel, filename: string): void {
        if(!channel || !filename) return;

        channel.join().then(con => {
            const listener = con.playFile(this.getFullFilePath(filename));

            listener.on('end', () => con.disconnect());
            listener.once('error', (err) => con.disconnect());
        }).catch(err => {
            console.error(err);
        })
    }

    private getFullFilePath(filename: string) {
        if (!this.audios.files[filename]) {
            console.error("[!] Filename not found in audios.config.json file", filename);
        }

        const fullPath = path.join(this.audios.root, this.audios.files[filename]);

        if (!fs.existsSync(fullPath)) {
            console.error("[!] File not found,", filename);
        }

        return fullPath;
    }
}