import { IDisposable } from 'rx';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

import * as _ from 'lodash';
import { commonRegex } from '../helpers';
import { GalleryDl } from '../services';

@injectable()
export class IgImageCommand implements ICommand {

    _command: string = commands.igimage;
    _subscriptions: IDisposable[] = [];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(TYPES.IHttp) private _http: IHttp,
        @inject(TYPES.Logger) private _logger: ILogger,
        @inject(GalleryDl) private _gallerydl: GalleryDl,
    ) { }

  attach(): void {
    this._subscriptions.push(this._client
      .getCommandStream(this._command)
      .subscribe(imsg => {
        Promise.resolve().then(async _ => {
          let msg = imsg.Message;

          const content = imsg.Content;

          // Ensure only instagram links are used here
          let link = commonRegex.link.exec(content);

          if (!link || link.length < 1) {
            msg.channel.send("No link found ...", { reply: msg });
            imsg.done("No link", true);

            return;
          }

          const mediaLinks = await this._gallerydl.fetchMediaLink(link[0])

          for (const mediaLink of mediaLinks) {
            if (!commonRegex.link.test(mediaLink)) {
              throw new Error(`${mediaLink} is not a link`)
            }
          }

          this._logger.info(`Fetching data for ${mediaLinks}`)
          const files = (await this.getDataStreamPeLink(mediaLinks))
            .map(({ data, name }) => ({
              attachment: data,
              name
            }))

          return imsg.send("", { files })
        }).catch((err) => {
          this._logger.error(err)
          imsg.done('Failed igimage', true)
        })
      }));
  }

  async getDataStreamPeLink(links) {
    return Promise.all(links.map(link => this._http.getFile(link)))
  }
}
