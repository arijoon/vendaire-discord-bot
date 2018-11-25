import { inject, injectable, multiInject } from 'inversify';
import { TYPES } from '../ioc/types';
import * as express from 'express';

import * as  errorHandler from 'errorhandler';
import * as http from 'http';
import { IController } from './IController';
import { IControllerV2 } from './IControllerV2';

@injectable()
export class Server implements IStartable {
  private app: express.Application;

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger,
    @multiInject(TYPES.Controller) private _controllers: IController[],
    @multiInject(TYPES.ControllerV2) private _controllersv2: IControllerV2[],
  ) { }

  public async start(): Promise<void> {
    const config = this._config.app.server;
    this.app = express();
    this.app.use(errorHandler());

    const router: express.Router = express.Router();
    const publicRouter: express.Router = express.Router();

    this.addRoutesV2(publicRouter, this._controllersv2);
    this.addRoutes(router);

    this.app.use('/', router);
    this.app.use('/public', publicRouter);

    const port = config.port;
    const location = config.address || '0.0.0.0';

    const server = http.createServer(this.app)

    this.app.set('port', port || 5010);

    server.listen(this.app.get('port'), location, () => {
      this._logger.info(
        `Default server is running at http://${location}:${port} in ${this._config.env} mode`);
    });
  }

  private addRoutes(router: express.Router) {
    for (let controller of this._controllers) {
      const action = this.makeController((args) => controller.action(args));

      switch (controller.verb.toUpperCase()) {
        case 'GET':
          router.get(controller.path, action);
          break;
        case 'POST':
          router.post(controller.path, action);
          break;
        case 'PUT':
          router.put(controller.path, action);
          break;
      }
    }
  }

  private makeController(promise: (...args: any[]) => Promise<any>, params?) {
    return async (req, res, next) => {
      const boundParams = params ? params(req, res, next) : [];
      try {
        const { result, type } = await promise(...boundParams);
        if(!type || type == 'json') {
          return res.json(result || { message: 'OK' });
        } else {
          res.set('Content-Type', type);
          res.send(result);
        }
      } catch (error) {
        return res.status(500) && next(error);
      }
    };
  }

  private verbMapping = {
    'GET':    (router: express.Router) => (path, callback) => router.get(path, callback),
    'POST':   (router: express.Router) => (path, callback) => router.post(path, callback),
    'PUT':    (router: express.Router) => (path, callback) => router.put(path, callback),
    'DELETE': (router: express.Router) => (path, callback) => router.delete(path, callback)
  };

  private addRoutesV2(router: express.Router, controllers: IControllerV2[]) {
    for(let controller of controllers) {
      const fn: (router: express.Router) => express.IRouterMatcher<express.Router> = this.verbMapping[controller.verb.toUpperCase()];
      this.makeControllerV2(controller, fn(router));
    }
  }

  private makeControllerV2(controller: IControllerV2, router: express.IRouterMatcher<express.Router>) {
    router(controller.path, async (req, res, next) => {
      controller.action(req, res)
        .catch(err => {
          const status: number = parseFloat(err);
          if(status)
            res.status(status) && next(err);
          else
            res.status(500) && next(err);
        });
    });
  }
}