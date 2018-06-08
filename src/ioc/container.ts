import { WhichCommand } from './../commands/which.command';
import { FlipCommand } from "../commands/flip.command";
import { MessageUtilsHelper } from './../helpers/message-utils.helper';
import { IMessageUtils } from './../contracts/IMessageUtils';
import { RollCommand } from './../commands/roll.command';
import { IgDownload } from './../commands/igdownload';
import { UrbanDicCommand } from './../commands/urban.command';
import { IgImageCommand } from './../commands/igimage';
import { SuggestCommand } from './../commands/suggest';
import { RockPaperSiccors } from './../commands/games/rps';
import { TranslateCommand } from './../commands/translate';
import { ImdbCommand } from './../commands/imdb';
import { ImMeme } from './../commands/image/meme.im';
import { ImGray } from './../commands/image/gray.im';
import { FourChanApi } from './../services/4chan.api.service';
import { IPermission } from './../contracts/IPermission';
import { FourChan } from './../commands/4chan';
import { CountUsage } from './../commands/count-usage.';
import { BanPhrase } from './../commands/ban-phrase';
import { WhosOnline } from './../commands/whos-online.command.';
import { MyAnimeListCommand } from './../commands/my-anime-list.command';
import { MathCommand } from './../commands/math.command';
import { RateCommand } from './../commands/rate.command';
import { ICache, IBasicCache } from '../contracts/ICache';
import { CacheString } from './../services/cache-string.service';
import { CacheRedis } from './../services/cache-redis.service';
import { SpaceOutCommand } from './../commands/space-out.command';
import { RegionalCommand } from './../commands/regional.command';
import { YoutubeSearch } from './../commands/youtube.command';
import { IsCommand } from './../commands/is.command';
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
import { PermissionService } from "../services/permission.service";
import { Search } from "../commands/search";
import { AddPicCommand } from '../commands/add-pic.command';
import { Logger } from '../helpers/logger';

const consoleLogger = new Logger(console);

consoleLogger.info(`[container.ts:${process.pid}] Building container`);

const container = new Container();

// Utils
container.bind<ILogger>(TYPES.Logger).toConstantValue(consoleLogger);

// Core components
container.bind<Container>(TYPES.Container).toConstantValue(container);
container.bind<IClient>(TYPES.IClient).to(Client).inSingletonScope();

// Apis
container.bind(FourChanApi).toSelf();

// Services
container.bind<IAudioPlayer>(TYPES.IAudioPlayer).to(AudioPlayerService).inSingletonScope();
container.bind<IFiles>(TYPES.IFiles).to(FilesService).inSingletonScope();
container.bind<IContent>(TYPES.IContent).to(Content).inSingletonScope();
container.bind<IQuestionService>(TYPES.IQuestion).to(QuestionService).inSingletonScope();
container.bind<IConfig>(TYPES.IConfig).to(Config).inSingletonScope();
container.bind<IHttp>(TYPES.IHttp).to(HttpService);
container.bind<IPermission>(TYPES.IPermission).to(PermissionService);
container.bind<IMessageUtils>(TYPES.IMessageUtils).to(MessageUtilsHelper);
container.bind<ICache<string, any>>(TYPES.ICacheString).to(CacheString);
container.bind<IBasicCache>(TYPES.IBasicCache).to(CacheRedis);

// Commands
container.bind<ICommand>(TYPES.ICommand).to(PlayTrump).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Help).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Disconnect).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(RandomPic).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Bog).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(QuestionCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(IsCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(RegionalCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(SpaceOutCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(YoutubeSearch).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(RateCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(MathCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(MyAnimeListCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(WhosOnline).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(BanPhrase).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(CountUsage).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(FourChan).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Search).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(ImdbCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(TranslateCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(RockPaperSiccors).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(SuggestCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(IgImageCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(IgDownload).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(UrbanDicCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(RollCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(FlipCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(WhichCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(AddPicCommand).inSingletonScope();
// container.bind<ICommand>(TYPES.ICommand).to(ImGray).inSingletonScope();
// container.bind<ICommand>(TYPES.ICommand).to(ImMeme).inSingletonScope();

export { container };