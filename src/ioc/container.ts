import { IIntent } from 'aleksa/IIntent';
import { Container } from 'inversify';
import { TYPES } from './types';
import { Client } from '../client';
import * as Services from '../services';
import * as Aleksa from '../aleksa';
import * as AleksaIntents from '../aleksa/intents';
import * as Commands from '../commands';
import * as Contracts from '../contracts';
import * as Helpers from '../helpers';


const consoleLogger = new Helpers.Logger(console);

consoleLogger.info(`[container.ts:${process.pid}] Building container`);

const container = new Container();

// Helpers
container.bind<ILogger>(TYPES.Logger).toConstantValue(consoleLogger);
container.bind<Contracts.IMessageUtils>(TYPES.IMessageUtils).to(Helpers.MessageUtilsHelper);

// Core components
container.bind<Container>(TYPES.Container).toConstantValue(container);
container.bind<Contracts.IClient>(TYPES.IClient).to(Client).inSingletonScope();

// Apis
container.bind(Services.FourChanApi).toSelf();

// Aleksa
container.bind<IStartable>(TYPES.AleksaServer).to(Aleksa.AleksaServer).inSingletonScope();
container.bind(TYPES.AleksaServerSelector).to(Aleksa.ServerSelectorService).inSingletonScope();
for(let key in AleksaIntents) {
  if(!AleksaIntents.hasOwnProperty(key)) continue;
  container.bind<IIntent>(TYPES.IIntent).to(AleksaIntents[key]).inSingletonScope();
}

// Services
container.bind<Contracts.IAudioPlayer>(TYPES.IAudioPlayer).to(Services.AudioPlayerService).inSingletonScope();
container.bind<IFiles>(TYPES.IFiles).to(Services.FilesService).inSingletonScope();
container.bind<IContent>(TYPES.IContent).to(Services.Content).inSingletonScope();
container.bind<Contracts.IQuestionService>(TYPES.IQuestion).to(Services.QuestionService).inSingletonScope();
container.bind<IConfig>(TYPES.IConfig).to(Services.Config).inSingletonScope();
container.bind<IHttp>(TYPES.IHttp).to(Services.HttpService);
container.bind<IPermission>(TYPES.IPermission).to(Services.PermissionService);
container.bind<ICache<string, any>>(TYPES.ICacheString).to(Services.InMemoryCache);
container.bind<IBasicCache>(TYPES.IBasicCache).to(Services.CacheRedis);
container.bind<IOrderedSetDataAccess>(TYPES.IOrderedSetDataAccess).to(Services.OrderedSetDataAccess);

// Commands
container.bind<ICommand>(TYPES.ICommand).to(Commands.PlayTrump).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.Help).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.Disconnect).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.RandomPic).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.Bog).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.QuestionCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.IsCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.RegionalCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.SpaceOutCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.YoutubeSearch).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.RateCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.MathCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.MyAnimeListCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.WhosOnline).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.BanPhrase).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.CountUsage).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.FourChan).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.Search).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.ImdbCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.TranslateCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.RockPaperSiccors).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.SuggestCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.IgImageCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.IgDownload).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.UrbanDicCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.RollCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.FlipCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.WhichCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.AddPicCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.Replay).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.RemindCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.DidThanosKillMeComand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.WorldCupCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.EightBall).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.SteamUrlCommand).inSingletonScope();
// container.bind<ICommand>(TYPES.ICommand).to(Commands.ImGray).inSingletonScope();
// container.bind<ICommand>(TYPES.ICommand).to(Commands.ImMeme).inSingletonScope();

export { container };