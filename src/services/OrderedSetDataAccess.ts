import { inject, injectable } from 'inversify';
import { TYPES } from '../ioc/types';
import * as redis from 'redis';

@injectable()
export class OrderedSetDataAccess implements IOrderedSetDataAccess {

  _enabled: boolean;
  _client: redis.RedisClient;

  constructor(
    @inject(TYPES.IConfig) config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger,
  ) {

    const enabled = !!config.app.redis && !config.app.redis.disabled;
    if (!enabled) return;

    const server = config.app.redis.server;
    const port = config.app.redis.port;

    this._client = redis.createClient({
      host: server,
      port: port
    });

    this._client.on("error", err => {
      _logger.error("Error in redis client ");
      _logger.error(err);
    });

    this._client.on("connect", () => this._enabled = true);
    this._client.on("end", function () {
      this._enabled = false;
      _logger.error("Connetion to redis closed", arguments);
    });

    this._client.on("reconnecting", ({ attempt, delay, error }) => {
      this._enabled = false;
      _logger.error(`Trying to reconnect attempt; ${attempt}, delay: ${delay}`, error);
    });
  }

  addValues(setKey: string, values: IKeyValuePair[]): Promise<void> {
    if(!this._enabled) 
      return Promise.resolve();

    return new Promise<void>((r, x) => {
      const args : (string|number)[] = [];
      for(let v of values){
        args.push(v.key);
        args.push(v.value);
      }

      this._client.zadd(setKey, ...args, (err, _) => {
        if(err) {
          this._logger.error(`Redis failed to add values ${setKey}: ${args.join(', ')}`, err);
          x(err);
        }
        else
          r();
      });
    });
  }

  getRange(setKey: string, min: number, max: number, limit?: number): Promise<IKeyValuePair[]> {
    if(!this._enabled) 
      return Promise.resolve([]);

    if(!limit)
      limit = 100;

    return new Promise<IKeyValuePair[]>((r, x) => {
      this._client.zrangebyscore(setKey, min, max, 'WITHSCORES', 'LIMIT', 0, limit, (err, resp) => {
        if(err) {
          this._logger.error(`Redis failed to get range ${setKey}: ${min}, ${max}`, err);
          x(err);
          return;
        }

        const result: IKeyValuePair[] = [];
        for(let i = 0; i < resp.length-1; i += 2) {
          const content = resp[i];
          const key = resp[i+1];

          result.push({ key: +key, value: content});
        }

        r(result);
      });
    });
  }

  removeRange(setKey: string, min: number, max: number): Promise<void> {
    if(!this._enabled) 
      return Promise.resolve();

    return new Promise<void>((r, x) => {
      this._client.zremrangebyscore(setKey, min, max, (err, _) => {
        if(err)
          x(err);
        else
          r();
      });
    });
  }
}