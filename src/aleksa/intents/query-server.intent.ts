import { ServerSelectorService } from './../server-selector.service';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';

import { IIntent } from 'aleksa/IIntent';

@injectable()
export class QueryServerIntent implements IIntent  {
  name: string = "QueryServerIntent";

  constructor(
    @inject(TYPES.AleksaServerSelector) private _serverSelector: ServerSelectorService
  ) { }

  getCallback(_): (request: any, response: any) => Promise<void> {
    return async (_, res) => {
      const server = await this._serverSelector.getServer();

      res.say(`You are in ${server.name}`);
    };
  }
}
