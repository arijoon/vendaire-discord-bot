import { IMessage } from './../contracts/IMessage';
import { IDisposable } from 'rx';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

import * as _ from 'lodash';
import * as opt from 'optimist';
import { commonRegex } from '../helpers';
import { GalleryDl } from '../services';

const LIMIT = 10

@injectable()
export class IgImageCommand implements ICommand, IHasHelp {

    _command: string = commands.igimage;
    _subscriptions: IDisposable[] = [];

    constructor(
        @inject(TYPES.IClient) private _client: IClient,
        @inject(TYPES.IConfig) private _config: IConfig,
        @inject(TYPES.IHttp) private _http: IHttp,
        @inject(TYPES.Logger) private _logger: ILogger,
        @inject(GalleryDl) private _gallerydl: GalleryDl,
    ) { }

  getHelp(): IHelp[] {
    return [
      {
        Key: this._command,
        Message: 'Fetch media content of an ig post link',
        Usage: this.setupOptions(['']).help()
      }
    ]
  }

  attach(): void {
    this._subscriptions.push(this._client
      .getCommandStream(this._command)
      .subscribe(imsg => {
        Promise.resolve().then(async _ => {
          let argv = this.setupOptions(imsg.Content.split(' '));
          let ops = argv.argv

          // Ensure only instagram links are used here
          let link = commonRegex.link.exec(imsg.Content);

          if (!link || link.length < 1) {
            imsg.send("No link found ...");
            return imsg.done("No link", true);
          }

          let mediaLinks = await this._gallerydl.fetchMediaLink(link[0])

          for (const mediaLink of mediaLinks) {
            if (!commonRegex.link.test(mediaLink)) {
              throw new Error(`${mediaLink} is not a link`)
            }
          }

          if (ops.i) {
            const index = Number(ops.i) - 1

            if (index >= mediaLinks.length || index < 0) {
              return Promise.all([
                imsg.send(`Index ${ops.i} is out of bounds (max links: ${mediaLinks.length})`),
                imsg.done('Invalid links length', true)
              ])
            }

            mediaLinks = [mediaLinks[index]]
          } else {
            if (mediaLinks.length > LIMIT) {
              mediaLinks = mediaLinks.slice(0, LIMIT)
            }
          }

          this._logger.info(`Fetching data for ${mediaLinks}`)
          const files = (await this.getDataStreamPeLink(mediaLinks))
            .map(({ data, name }) => ({
              attachment: data,
              name
            }))

          return imsg.send("", { files })
        }).then(() => imsg.done())
          .catch((err) => {
            this._logger.error(err)
            imsg.done('Failed igimage', true)
          })
      }));
  }

  async getDataStreamPeLink(links) {
    return Promise.all(links.map(link => this._http.getFile(link)))
  }

  setupOptions(args: string[]): any {
    return opt(args)
      .usage('Post direct media links of any content on instagram')
      .options('i', {
        alias: 'index',
        describe: 'specify the index of the image you want, starting from `1` for first image',
      });
  }
}
