import { IControllerV2 } from './../IControllerV2';
import * as e from 'express';
import { injectable, inject } from 'inversify';
import { verbs } from '../controllers/verbs';
import { TYPES } from '../../ioc/types';
import { unauthorized } from '../http-utils';
import { constants } from '../constants';

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
      .then(async (sess: ISession) => {
        const newSession = await this._sessionManager.genSession(sess.user);

        res.cookie(constants.sessionKey, newSession.id);
        res.send("Session valid, singed in");
      }).catch(_ => unauthorized());
  }
}