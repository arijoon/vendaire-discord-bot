import { AudioPlayerService } from './../services/audio-player.service';
import { IAudioPlayer } from './../contracts/IAudioPlayer';
import { Container } from 'inversify';
import { SayHello } from '../commands/say-hello.command';
import { Help } from "../commands/help.command";
import { TYPES } from "./types";
import { Client } from "../client";
import { IClient } from "../contracts/IClient";
import { ICommand } from "../contracts/ICommand";

console.log("[container.ts] Building container");

let container = new Container();

// Core components
container.bind<IClient>(TYPES.IClient).to(Client).inSingletonScope();

// Services
container.bind<IAudioPlayer>(TYPES.IAudioPlayer).to(AudioPlayerService).inSingletonScope();

// Commands
container.bind<ICommand>(TYPES.ICommand).to(SayHello);
container.bind<ICommand>(TYPES.ICommand).to(Help);

export { container };