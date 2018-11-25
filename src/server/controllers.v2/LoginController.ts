import { IControllerV2 } from './../IControllerV2';
import * as e from 'express';
import { injectable, inject } from 'inversify';
import { verbs } from '../controllers/verbs';
import { TYPES } from '../../ioc/types';
import { unauthorized } from '../http-utils';

@injectable()
export class LoginController implements IControllerV2 {
  verb: string = verbs.get;  
  path: string = "/login";

  constructor(
    @inject(TYPES.SessionManager) private _sessionManager: ISessionManager
  ) { }

  async action(req: e.Request, res: e.Response): Promise<any> {
    if(!req.query.id) {
      unauthorized();
    }

    return this._sessionManager.useSingle(req.query.id)
      .then((sess) => res.send(sess))
      .catch(err => unauthorized());
  }
}