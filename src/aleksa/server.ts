import { injectable, inject, multiInject } from 'inversify';
import { TYPES } from '../ioc/types';

import * as express from 'express';
import { IIntent } from './IIntent';
import { parseIntentSchema } from './intents-utils';

const errorHandler = require("errorhandler"),
  https = require('https'),
  alexaApp = require('alexa-app');

@injectable()
export class AleksaServer implements IStartable {
  private app: any;
  private aleksaApp: any;

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IFiles) private _filesService: IFiles,
    @multiInject(TYPES.IIntent) private _intents: IIntent[]
  ) { }

  public async start(): Promise<void> {
    const config = this._config.app.aleksa;

    if(!config.isEnabled) {
      this._logger.info("Alexa server is disabled");
      return;
    }

    this.app = express();

    await this.setupAleksaApp(this.app, config);
    this.app.use(errorHandler());

    const key = await this._filesService.readFileBuffer(config.server.key);
    const cert = await this._filesService.readFileBuffer(config.server.cert);
    const port = config.server.port;
    const location = config.server.address || "0.0.0.0";

    const server = https.createServer({
      key, cert
    }, this.app);

    this.app.set("port", port || 443);

    server.listen(this.app.get("port"), location, () => {
      this._logger.info(
        `Aleksa server is running at http://${location}:${port} in ${this._config.env} mode`);
    });
  }

  private async setupAleksaApp(app: any, config: any) {
    this.aleksaApp = new alexaApp.app('aleksa');

    this.aleksaApp.express({ expressApp: app, checkCert: false, debug: this._config.isDev });
    const schemaJson = await this._filesService.readFile(config.intentSchema, false)
    const schema = parseIntentSchema(JSON.parse(schemaJson));

    for (let intent of this._intents) {
      this.aleksaApp.intent(intent.name,
        schema[intent.name],
        await intent.getCallback(config));

      this._logger.info(`Attached Intent: ${intent.name}`);
    }
  }
}
