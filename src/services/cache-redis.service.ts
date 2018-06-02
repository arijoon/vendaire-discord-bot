import { IConfig } from './../contracts/IConfig';
import { injectable, inject } from 'inversify';
import { IBasicCache } from './../contracts/ICache';
import { TYPES } from "../ioc/types";
import * as redis from 'redis';
import { PermissionService } from './permission.service';

@injectable()
export class CacheRedis implements IBasicCache {

  _client: redis.RedisClient;
  _enabled: boolean;
  _cacheTimeoutInSeconds: number;

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig
  ) {
    this._enabled = _config.secret.cache;
    this._cacheTimeoutInSeconds = _config.secret.cacheTimeout;
    const server = _config.secret.redis.server;
    const port = _config.secret.redis.port;

    this._client = redis.createClient({
      host: server,
      port: port
    });

    this._client.on("error", err => {
      console.error("Error in redis client ", err);
    });
  }

  has(key: string): Promise<boolean> {
    if (!this._enabled) return Promise.resolve(false);

    return new Promise((r, x) => {
      this._client.exists(key, (err, res) => {
        if (err)
          x(err);
        else
          r(res == 1)
      })
    });
  }

  get(key: string): Promise<string> {
    return new Promise((r, x) => {
      this._client.get(key, (err, res) => {
        if (err)
          x(err);
        else
          r(res);
      })
    });
  }

  set(key: string, val: string): Promise<void> {
    if (!this._enabled) Promise.resolve();
    return new Promise((r, x) => {
      this._client.get(key, (err, res) => {
        if (err)
          x(err);
        else
          r();
      })
    });
  }

  getType<T>(key: string): Promise<T> {
    throw "Not supported method"
  }
}
