import { IPermission } from './../contracts/IPermission';
import { ICache } from './../contracts/ICache';
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

    // Multithreading
    IProcess: Symbol("IProcess"),
    IProcessManager: Symbol("IProcessManager"),

    // Apis
    FourChanApi: Symbol("FourChanApi"),
    ICommand: Symbol("ICommand")
};

export { TYPES };