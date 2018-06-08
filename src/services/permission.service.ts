import { injectable, inject } from 'inversify';
import { TYPES } from "../ioc/types";

@injectable()
export class PermissionService implements IPermission {
        
    constructor(
        @inject(TYPES.IConfig) private _config: IConfig
    ) { }

    isAdmin(username: string): boolean {
        return username.toLowerCase().trim() == this._config.admin;
    }
}
