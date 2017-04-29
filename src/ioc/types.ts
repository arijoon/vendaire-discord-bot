import { IPermission } from './../contracts/IPermission';
import { ICache } from './../contracts/ICache';
let TYPES = {
    IClient: Symbol("IClient"),
    IAudioPlayer: Symbol("IAudioPlayer"),
    IConfig: Symbol("IConfig"),
    IFiles: Symbol("IFiles"),
    IHttp: Symbol("IHttp"),
    IQuestion: Symbol("IQuestion"),
    IContent: Symbol("IContent"),
    ICacheString: Symbol("ICache<string, any>"),
    IPermission: Symbol("IPermission"),
    ICommand: Symbol("ICommand")
};

export { TYPES };