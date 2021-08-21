import { inject, injectable } from 'inversify';
import { TYPES } from '../ioc/types';
import { runCommand } from '../helpers';

@injectable()
export class GalleryDl {
  constructor(
    @inject(TYPES.Logger) private _logger: ILogger,
  ) { }

  async fetchMediaLink(link: string, options: any = {}) {
    return (await runCommand(`gallery-dl -g "${link}"`, this._logger))
      .split('\n')
      .map(link => link.trim())
      .filter(link => link)
  }
}
