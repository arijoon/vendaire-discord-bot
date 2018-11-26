import { IControllerV2 } from './../IControllerV2';
import * as e from 'express';
import { injectable, inject } from 'inversify';
import { verbs } from '../controllers/verbs';
import { TYPES } from '../../ioc/types';
import { getSession } from '../http-utils';

@injectable()
export class HomeController implements IControllerV2 {
  verb: string = verbs.get;
  path: string = "/home";

  constructor(
    @inject(TYPES.Logger) private _logger: ILogger
  ) { }

  async action(req: e.Request, res: e.Response): Promise<any> {
    const session: ISession = getSession(req);
    this._logger.info(`user id is ${session.user}, expires in ${new Date(session.expiry)}`)

    res.send(session);
  }
}