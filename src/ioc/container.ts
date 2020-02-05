import { Container } from 'inversify';
import { TYPES } from './types';
import { Client } from '../client';
import * as Services from '../services';
import * as Aleksa from '../aleksa';
import * as AleksaIntents from '../aleksa/intents';
import * as Commands from '../commands';
import * as Contracts from '../contracts';
import * as Helpers from '../helpers';
import * as Server from '../server';
import * as Controllers from './../server/controllers';
import * as ControllersV2 from './../server/controllers.v2';
import { IStatsCollector, PrometheusStatsCollector } from '../diagnostics';


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
container.bind(Services.FileServerApi).toSelf();

// Server
container.bind<IStartable>(TYPES.Server).to(Server.Server).inSingletonScope();
container.bind(TYPES.MiddleWares).to(Server.MiddleWares).inSingletonScope();
addallChildren<Server.IController>(container, Controllers, TYPES.Controller);
addallChildren<Server.IControllerV2>(container, ControllersV2, TYPES.ControllerV2);

// Aleksa
container.bind<IStartable>(TYPES.AleksaServer).to(Aleksa.AleksaServer).inSingletonScope();
container.bind(TYPES.AleksaServerSelector).to(Aleksa.ServerSelectorService).inSingletonScope();
addallChildren<Aleksa.IIntent>(container, AleksaIntents, TYPES.IIntent);

// Core Services
container.bind<Contracts.IAudioPlayer>(TYPES.IAudioPlayer).to(Services.AudioPlayerService).inSingletonScope();
container.bind<IFiles>(TYPES.IFiles).to(Services.FilesService).inSingletonScope();
container.bind<IContent>(TYPES.IContent).to(Services.Content).inSingletonScope();
container.bind<Contracts.IQuestionService>(TYPES.IQuestion).to(Services.QuestionService).inSingletonScope();
container.bind<IConfig>(TYPES.IConfig).to(Services.Config).inSingletonScope();
container.bind<IHttp>(TYPES.IHttp).to(Services.HttpService);
container.bind<IPermission>(TYPES.IPermission).to(Services.PermissionService);
container.bind<ICache<string, any>>(TYPES.ICacheString).to(Services.InMemoryCache);
container.bind<IBasicCache>(TYPES.IBasicCache).to(Services.CacheRedis).inSingletonScope();
container.bind<IOrderedSetDataAccess>(TYPES.IOrderedSetDataAccess).to(Services.OrderedSetDataAccess);
container.bind<Services.ReadThroughCacheFactory>(TYPES.ReadThroughCacheFactory).to(Services.ReadThroughCacheFactory).inSingletonScope();

// Auth
container.bind<ISessionManager>(TYPES.SessionManager).to(Services.SessionManager).inSingletonScope();

// Features
container.bind<IStatsCollector>(TYPES.StatsCollector).to(PrometheusStatsCollector).inSingletonScope();

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
container.bind<ICommand>(TYPES.ICommand).to(Commands.AuthGenerator).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.AuthorizeCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.StyleImageCommand).inSingletonScope();
container.bind<ICommand>(TYPES.ICommand).to(Commands.RandomPassCommand).inSingletonScope();
// container.bind<ICommand>(TYPES.ICommand).to(Commands.ImGray).inSingletonScope();
// container.bind<ICommand>(TYPES.ICommand).to(Commands.ImMeme).inSingletonScope();

export { container };

function addallChildren<TBindingType>(container: Container, obj: any, typeKey: symbol) {
  for (let key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    container.bind<TBindingType>(typeKey).to(obj[key]).inSingletonScope();
  }
}