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

          return this._sessionManager.useSingle(req.query.id as string)
            .then(async (sess: ISession) => {
              const newSession = await this._sessionManager.genSession(sess.user);

              const domain = req.get('origin') || req.headers.host

              this._logger.info('Logging in', { user: sess.user, domain })

              res.cookie(constants.sessionKey, newSession.id, { domain });
              res.redirect('./');
            }).catch(err => {
                this._logger.error("Failed to login", err);
             unauthorized()});
        }
      }
    ]
  }
}