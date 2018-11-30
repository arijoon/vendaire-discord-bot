import { IControllerV2 } from './../IControllerV2';
import * as e from 'express';
import { injectable, inject } from 'inversify';
import { verbs } from '../controllers/verbs';
import { TYPES } from '../../ioc/types';
import { unauthorized } from '../http-utils';
import { constants } from '../constants';

@injectable()
export class LoginController implements IControllerV2 {
  constructor(
    @inject(TYPES.SessionManager) private _sessionManager: ISessionManager,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IConfig) private _config: IConfig
  ) { }

  get actions(){
    return [
      {
        verb: verbs.get,
        path: "/login",
        action: async (req: e.Request, res: e.Response): Promise<any> => {
          if (!req.query.id) {
            unauthorized();
          }

          this._logger.info("logging in with sessionId", req.query.id);
          return this._sessionManager.useSingle(req.query.id)
            .then(async (sess: ISession) => {
              const newSession = await this._sessionManager.genSession(sess.user);

              res.cookie(constants.sessionKey, newSession.id, { domain: this._config.app.server.domain});
              // res.send("Session valid, singed in");
              res.redirect('./');
            }).catch(err => {
                this._logger.error("Failed to login", err);
             unauthorized()});
        }
      }
    ]
  }
}