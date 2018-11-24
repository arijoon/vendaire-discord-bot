import { inject, injectable } from 'inversify';
import { TYPES } from '../ioc/types';
import * as express from 'express';

import * as  errorHandler from 'errorhandler';
import * as http from 'http';

@injectable()
export class Server implements IStartable {
  private app: any;

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger,
  ) { }

  public async start(): Promise<void> {
    const config = this._config.app.server;
    this.app = express();
    this.app.use(errorHandler());

    const port = config.port;
    const location = config.address || '0.0.0.0';

    const server = http.createServer(this.app)

    this.app.set('port', port || 5010);

    server.listen(this.app.get('port'), location, () => {
      this._logger.info(
        `Default server is running at http://${location}:${port} in ${this._config.env} mode`);
    });
  }
}