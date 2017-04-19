import { FilesService } from './../services/files.service';
import { Config } from './../services/config.service';
import { IConfig } from './../contracts/IConfig';
import { ThatFeel } from './../commands/tfw.command';
import { Disconnect } from './../commands/disconnect.command';
import { PlayTrump } from './../commands/play-trump.command';
import { AudioPlayerService } from './../services/audio-player.service';
import { IAudioPlayer } from './../contracts/IAudioPlayer';
import { Container } from 'inversify';
import { Help } from "../commands/help.command";
import { TYPES } from "./types";
import { Client } from "../client";
import { IClient } from "../contracts/IClient";
import { ICommand } from "../contracts/ICommand";
import { IFiles } from "../contracts/IFiles";

console.log("[container.ts] Building container");

let container = new Container();

// Core components
container.bind<IClient>(TYPES.IClient).to(Client).inSingletonScope();

// Services
container.bind<IAudioPlayer>(TYPES.IAudioPlayer).to(AudioPlayerService).inSingletonScope();
container.bind<IFiles>(TYPES.IFiles).to(FilesService).inSingletonScope();
container.bind<IConfig>(TYPES.IConfig).to(Config).inSingletonScope();

// Commands
container.bind<ICommand>(TYPES.ICommand).to(PlayTrump);
container.bind<ICommand>(TYPES.ICommand).to(Help);
container.bind<ICommand>(TYPES.ICommand).to(Disconnect);
container.bind<ICommand>(TYPES.ICommand).to(ThatFeel);

export { container };