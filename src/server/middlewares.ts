import { injectable, inject } from "inversify";
import { TYPES } from "../ioc/types";
import * as _ from 'lodash';
import * as e from 'express';
import { constants } from "./constants";
import { IClient } from "contracts";

@injectable()
export class MiddleWares {
  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.SessionManager) private _sessionManager: ISessionManager,
  ) { }

  public authentication(exclusions?: string[]) {
    return async (req: e.Request, res: e.Response, next) => {
      (<any>req).session = null;

      this._logger.info(`Requested ${req.path}`)
      if(exclusions && exclusions.indexOf(req.path) > -1) {
        return next();
      }

      const clearToken = () => {
        res.clearCookie(constants.sessionKey);
        res.status(401);
        res.send();
      }

      const sessionId = req.cookies[constants.sessionKey];
      if(!sessionId) {
        return clearToken();
      }

      // Validate session key
      const { status, session } = await this._sessionManager.isValid(sessionId);

      if(!(status && session)) {
        return clearToken()
      }

      (<any>req).session = session;
      next();
    }
  }

  public logger() {
    return async (req: e.Request, _, next) => {
      const session: ISession = (<any>req).session;
      try {
        if(session) {
          const username = await this._client.getUserName(session.user);
          this._logger.info(`${req.method} ${req.path} by user: ${username}`);
        } else {
          this._logger.info(`${req.method} ${req.path} by user: UNKNOWN, ip: ${req.ip}`);
        }
      } catch(ex) { /* Empty catch */ }
      finally { next(); }
    }
  }

}