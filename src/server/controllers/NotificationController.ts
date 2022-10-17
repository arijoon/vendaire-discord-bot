import { IController } from '../IController';
import * as e from 'express';
import { verbs } from './verbs';
import { TYPES } from '../../ioc/types';
import { inject, injectable } from 'inversify';
import { IClient } from 'contracts';

@injectable()
export class NotificationController implements IController {
  readonly verb: string = verbs.post;
  readonly path: string = '/notification';

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IConfig) private _config: IConfig,
  ) { }

  async action(req: e.Request): Promise<any> {
    const adminId = this._config.adminId
    const { message } = req.body

    this._logger.info('Incoming message to notify admin', message)

    await this._client.sendMessageToUser(
      adminId,
      message
    )

    return {
      type: 'json',
      result: { }
    };
  }
}