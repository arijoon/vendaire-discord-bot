import { inject } from "inversify";
import { TYPES } from "../ioc/types";

export class SessionManager implements ISessionManager {
  sessionDefaultExpiry: number;

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IBasicCache) private _cache: IBasicCache,
  ) {
    this.sessionDefaultExpiry = _config.app.auth.sessionTimeout;
  }

  async genSession(userId: string): Promise<ISession> {
    const now = Date.now();
    const session: ISession = this.genSessionInner(userId);

    const json = JSON.stringify(session);
    const key = makeKey(session.id);
    await this._cache.set(key, json, this.sessionDefaultExpiry);

    return session;
  }  

  async genSingleSession(userId: string): Promise<ISessionSingle> {
    const session: ISessionSingle = {
      ...this.genSessionInner(userId),
      singleUsedAt: null
    };

    const json = JSON.stringify(session);
    const key = makeSingleKey(session.id);
    await this._cache.set(key, json, this.sessionDefaultExpiry);


    return session;
  }

  async useSingle(sessionId: string): Promise<void> {
    const key = makeSingleKey(sessionId);
    const exists = await this._cache.has(key);

    if(!exists) {
      throw Error("Invalid sessionId");
    }


  }

  isValid(sessionId: string): Promise<{ status: boolean; session: ISession; }> {
    throw new Error("Method not implemented.");
  }

  private genSessionInner(userId: string): ISession {
    const now = Date.now();
    return {
      user: userId,
      id: genSessionId(),
      timestamp: now,
      expiry: now + this.sessionDefaultExpiry
    };
  }
}

function makeSingleKey(sessionId: string, prefix?: string) {
  return makeKey(sessionId, "SINGLE");
}

function makeKey(sessionId: string, prefix?: string) {
  return `AUTH:SESSION:${prefix ? prefix + ":" : ""}${sessionId}`; 
}

function genSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}