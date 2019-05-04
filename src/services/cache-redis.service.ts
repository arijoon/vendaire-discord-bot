import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import * as redis from 'redis';

@injectable()
export class CacheRedis implements IBasicCache {

  _client: redis.RedisClient;
  _enabled: boolean = false;
  _cacheTimeoutInSeconds: number;

  constructor(
    @inject(TYPES.IConfig) config: IConfig
  ) {
    const enabled = config.app.cache;
    if(!enabled) return;

    this._cacheTimeoutInSeconds = config.app.cacheTimeout || 76400;
    const server = config.app.redis.server;
    const port = config.app.redis.port;

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
    if (!this._enabled)
      return Promise.resolve(false);

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
    if (!this._enabled)
      return Promise.resolve(null);

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

  set(key: string, val: string, expiryInSeconds?: number): Promise<void> {
    if (!this._enabled)
      return Promise.resolve();

    key = this.escapeKeys(key);
    return new Promise<void>((r, x) => {
      const cb = (err, res) => {
        if (err) {
          console.error(err);
        }

        r();
      };

      if (expiryInSeconds === 0)
        this._client.set(key, val, cb)
      else
        this._client.set(key, val, 'EX', Math.floor(expiryInSeconds) || this._cacheTimeoutInSeconds, cb)
    });
  }

  remove(key: string): Promise<void> {
    return new Promise<void>((r,x) => {
      this._client.del(key, (err, res) => {
        if(err) {
          x("Failed to remove");
        } else {
          r();
        }
      });
    });
  }

  keyEscapeMatcher: RegExp = /\\|\//g;
  escapeKeys(key: string) {
    return key.replace(this.keyEscapeMatcher, ":");
  }
}
