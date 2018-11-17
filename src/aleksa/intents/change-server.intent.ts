import { ServerSelectorService } from './../server-selector.service';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';

import { IIntent } from 'aleksa/IIntent';

@injectable()
export class ChangeServerIntent implements IIntent  {
  name: string = "ChangeServerIntent";

  constructor(
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.AleksaServerSelector) private _serverSelector: ServerSelectorService
  ) { }

  getCallback(_): (request: any, response: any) => Promise<void> {
    return async (req, res) => {
      let newServer: string = req.slot('server').toLowerCase();

      await this._serverSelector.changeServer(newServer);

      res.say(`changed to ${newServer}`);
    };
  }
}
