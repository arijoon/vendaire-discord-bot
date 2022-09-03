import { IClient } from './../contracts';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { inject, injectable } from 'inversify';
import { IDisposable } from 'rx';
import { getVoiceConnections } from '@discordjs/voice';


@injectable()
export class Disconnect implements ICommand {

  _command: string = commands.dc;
  _subscription: IDisposable;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.Logger) private _logger: ILogger,
  ) { }

  public attach(): void {
    this._subscription = this._client
      .getCommandStream(this._command)
      .subscribe(imsg => {
        getVoiceConnections().forEach((value, key) => {

          value.destroy()
          this._logger.info('Destroyed voice connection', key)
        })
        imsg.done();
      });
  }

  public detach(): void {
    this._subscription.dispose();
  }
}