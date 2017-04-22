import {IConfig} from '../contracts/IConfig';
import { injectable, inject } from 'inversify';
import { IAudioPlayer } from './../contracts/IAudioPlayer';
import { VoiceChannel, VoiceConnection } from 'discord.js';

import * as path from 'path';
import * as fs from "fs";
import { TYPES } from "../ioc/types";

// declare let require: any;

@injectable()
export class AudioPlayerService implements IAudioPlayer {

    _ytdl: any;
    _audios: any;
    _fileNames: string[];
    _working: boolean = false;
    _voiceConnection: VoiceConnection;

    constructor(
        @inject(TYPES.IConfig) private _config: IConfig
    ) {
        this._audios = _config.audios;
        this._fileNames = Object.keys(this._audios.files);
    }

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

        let filename = this._fileNames.random();

        this.playFile(channel, filename);
    }

    playFile(channel: VoiceChannel, filename: string): void {
        if(!channel || !filename || this._working) return;

        this._working = true;

        channel.join().then(con => {
            const listener = con.playFile(this.getFullFilePath(filename));

            listener.on('end', () => this.onEnd(con));
            listener.once('error', (err) => this.onEnd(con, err));
        }).catch(err => {
            this.onEnd(null, err);
        });
    }

    connect(channel: VoiceChannel): Promise<VoiceConnection> {
        let result =  channel.join().then(con => {
            this._voiceConnection = con;
            return con;
        });

        result.catch(err => console.error(err));

        return result;
    }

    onEnd(con: VoiceConnection, err?: any) {

        if(con)
            con.disconnect();

        if(err) {
            console.error(err)
        }

        this._working = false;
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
}