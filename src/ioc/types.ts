import { IPermission } from './../contracts/IPermission';
import { ICache } from './../contracts/ICache';
let TYPES = {
    Container: Symbol("Container"),
    IClient: Symbol("IClient"),
    IAudioPlayer: Symbol("IAudioPlayer"),
    IConfig: Symbol("IConfig"),
    IFiles: Symbol("IFiles"),
    IHttp: Symbol("IHttp"),
    IQuestion: Symbol("IQuestion"),
    IContent: Symbol("IContent"),
    ICacheString: Symbol("ICache<string, any>"),
    IPermission: Symbol("IPermission"),
    IProcess: Symbol("IProcess"),
    IProcessManager: Symbol("IProcessManager"),
    ICommand: Symbol("ICommand")
};

export { TYPES };