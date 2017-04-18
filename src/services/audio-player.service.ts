import { injectable } from 'inversify';
import { IAudioPlayer } from './../contracts/IAudioPlayer';
import { VoiceChannel } from 'discord.js';

import * as path from 'path';
import * as fs from "fs";

@injectable()
export class AudioPlayerService implements IAudioPlayer {

    _ytdl: any;
    _audios = require('../audios.config.json');
    _fileNames = Object.keys(this._audios.files);

    playFromYoutube(channel: VoiceChannel, url: string) {
        if(!channel || !url) return;

        if (!this._ytdl) {
            this._ytdl = require('ytdl-core')
        }

        channel.join().then(con => {

            let stream = this._ytdl(url, { filter: 'audioonly' });
            const listener = con.playStream(stream);

            listener.on('end', () => con.disconnect());
            listener.once('error', (err) => con.disconnect());
        }).catch(err => {
            console.error(err);
        })
    }

    playRandomFile(channel: VoiceChannel): void {
        if(!channel) return;

        let filename = this._fileNames[this.getRandomNumber(this._fileNames.length)];

        this.playFile(channel, filename);
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
        if (!this._audios.files[filename]) {
            console.error("[!] Filename not found in audios.config.json file", filename);
        }

        const fullPath = path.join(this._audios.root, this._audios.files[filename]);

        if (!fs.existsSync(fullPath)) {
            console.error("[!] File not found,", filename);
        }

        return fullPath;
    }

    private getRandomNumber(range: number) {
        return Math.floor(Math.random() * range);
    }
}