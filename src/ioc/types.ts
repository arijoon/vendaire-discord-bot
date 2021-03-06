import { ReadThroughCacheFactory } from './../services/ReadThroughCacheFactory';
let TYPES = {
    // Core
    Container: Symbol("Container"),
    IClient: Symbol("IClient"),

    // Services
    IAudioPlayer: Symbol("IAudioPlayer"),
    IConfig: Symbol("IConfig"),
    IFiles: Symbol("IFiles"),
    IHttp: Symbol("IHttp"),
    IQuestion: Symbol("IQuestion"),
    IContent: Symbol("IContent"),
    ICacheString: Symbol("ICache<string, any>"),
    IBasicCache: Symbol("IBasicCache"),
    IPermission: Symbol("IPermission"),
    IMessageUtils: Symbol("IMessageUtils"),
    IOrderedSetDataAccess: Symbol("IOrderedSetDataAccess"),
    ReadThroughCacheFactory: Symbol("ReadThroughCacheFactory"),

    // Apis
    FourChanApi: Symbol("FourChanApi"),
    ICommand: Symbol("ICommand"),

    // Utils
    Logger: Symbol("ILogger"),

    // Aleksa
    IIntent: Symbol("IIntent"),
    AleksaServer: Symbol("Intent"),
    AleksaServerSelector: Symbol("AleksaServerSelector"),

    // Diagnostircs
    StatsCollector: Symbol("StatsCollector"),

    // Server
    Server: Symbol("Server"),
    MiddleWares: Symbol("MiddleWares"),
    Controller: Symbol("Controller"),
    ControllerV2: Symbol("ControllerV2"),

    // Auth
    SessionManager: Symbol("SessionManager")
};

export { TYPES };