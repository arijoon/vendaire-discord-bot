import { YoutubeSearch } from './../commands/youtube.command';
import { IsGayCommand } from './../commands/is-gay.command';
import { QuestionCommand } from './../commands/question.command';
import { HttpService } from './../services/http.service';
import { IHttp } from './../contracts/IHttpService';
import { QuestionService } from './../services/question.service';
import { IQuestionService } from './../contracts/IQuestionService';
import { Content } from './../services/content.service';
import { IContent } from './../contracts/IContent';
import { FilesService } from './../services/files.service';
import { Config } from './../services/config.service';
import { IConfig } from './../contracts/IConfig';
import { RandomPic } from './../commands/random-pic.command';
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
import { Bog } from "../commands/bog.command";

console.log("[container.ts] Building container");

let container = new Container();

// Core components
container.bind<IClient>(TYPES.IClient).to(Client).inSingletonScope();

// Services
container.bind<IAudioPlayer>(TYPES.IAudioPlayer).to(AudioPlayerService).inSingletonScope();
container.bind<IFiles>(TYPES.IFiles).to(FilesService).inSingletonScope();
container.bind<IContent>(TYPES.IContent).to(Content).inSingletonScope();
container.bind<IQuestionService>(TYPES.IQuestion).to(QuestionService).inSingletonScope();
container.bind<IConfig>(TYPES.IConfig).to(Config).inSingletonScope();
container.bind<IHttp>(TYPES.IHttp).to(HttpService);

// Commands
container.bind<ICommand>(TYPES.ICommand).to(PlayTrump);
container.bind<ICommand>(TYPES.ICommand).to(Help);
container.bind<ICommand>(TYPES.ICommand).to(Disconnect);
container.bind<ICommand>(TYPES.ICommand).to(RandomPic);
container.bind<ICommand>(TYPES.ICommand).to(Bog);
container.bind<ICommand>(TYPES.ICommand).to(QuestionCommand);
container.bind<ICommand>(TYPES.ICommand).to(IsGayCommand);
container.bind<ICommand>(TYPES.ICommand).to(YoutubeSearch);

export { container };