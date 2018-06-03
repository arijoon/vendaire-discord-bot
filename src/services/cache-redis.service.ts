import { IConfig } from './../contracts/IConfig';
import { injectable, inject } from 'inversify';
import { IBasicCache } from './../contracts/ICache';
import { TYPES } from "../ioc/types";
import * as redis from 'redis';
import { PermissionService } from './permission.service';

@injectable()
export class CacheRedis implements IBasicCache {

  _client: redis.RedisClient;
  _enabled: boolean = false;
  _cacheTimeoutInSeconds: number;

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig
  ) {
    const enabled = _config.secret.cache;
    if(!enabled) return;

    this._cacheTimeoutInSeconds = _config.secret.cacheTimeout || 76400;
    const server = _config.secret.redis.server;
    const port = _config.secret.redis.port;

    this._client = redis.createClient({
      host: server,
      port: port
    });

    this._client.on("error", err => {
      console.error("Error in redis client ");
      console.error(err);
    });

    this._client.on("connect", () => this._enabled = true);
    this._client.on("end", function ()  {
      this._enabled = false;
      console.error("Connetion to redis closed", arguments);
    });

    this._client.on("reconnecting", ({attempt, delay, error}) => {
      this._enabled = false;
      console.error(`Trying to reconnect attempt; ${attempt}, delay: ${delay}`, error);
    });
  }

  has(key: string): Promise<boolean> {
    if (!this._enabled) return Promise.resolve(false);

    key = this.escapeKeys(key);
    return new Promise((r, x) => {
      this._client.exists(key, (err, res) => {
        if (err) {
          console.error(err);
          r(false);
        } else
          r(res == 1)
      })
    });
  }

  get(key: string): Promise<string> {
    if (!this._enabled) Promise.resolve(null);

    key = this.escapeKeys(key);
    return new Promise((r, x) => {
      this._client.get(key, (err, res) => {
        if (err) {
          console.error(err);
          r("");
        } else
          r(res);
      })
    });
  }

  set(key: string, val: string): Promise<void> {
    if (!this._enabled) Promise.resolve();

    key = this.escapeKeys(key);
    return new Promise<void>((r, x) => {
      this._client.set(key, val, 'EX', this._cacheTimeoutInSeconds, (err, res) => {
        if (err) {
          console.error(err);
        }

        r();
      })
    });
  }

  keyEscapeMatcher: RegExp = /\\|\//g;
  escapeKeys(key: string) {
    return key.replace(this.keyEscapeMatcher, ":");
  }
}
