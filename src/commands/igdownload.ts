import { IDisposable } from 'rx';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

import * as opt from 'optimist';

@injectable()
export class IgDownload implements ICommand {

  _command: string = commands.igdownload;
  _subscriptions: IDisposable[] = [];

  _fileNameFinder = /[\w\d_]+\.\w{3}\?/;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IHttp) private _httpClient: IHttp,
  ) { }

  attach(): void {
    this._subscriptions.push(this._client
      .getCommandStream(this._command)
      .subscribe(imsg => {
        let msg = imsg.Message;

        const content = imsg.Content;

        let argv = this.setupOptions(content.split(' '));
        let ops = argv.argv

        if (ops.h || !ops._ || ops._.length < 1) {
          msg.channel.send(argv.help(), { code: 'md' });
          imsg.done();
          return;
        }

        let url = this.getUrl(ops._[0]);

        this._httpClient.get(url)
          .then(body => {
            const parsed = JSON.parse(body.split('window._sharedData = ')[1]
              .split('\;\<\/script>')[0]);
            return parsed
              .entry_data.ProfilePage[0]
              .graphql.user.edge_owner_to_timeline_media.edges
          }).then(results => {
            return results
            .filter(item => item.node)
            .map(item => ({
              raw: item.node,
              image: item.node.display_url,
              dimensions: item.node.dimensions,
              likes: item.node.edge_liked_by.count,
              comments: item.node.edge_media_to_comment.count,
              video: item.node.is_video,
              code: item.node.shortcode,
              url: 'https://instagram.com/p/' + item.node.shortcode,
              timestamp: item.node.taken_at_timestamp,
              thumbnails: {
                150: item.node.thumbnail_resources[0].src,
                240: item.node.thumbnail_resources[1].src,
                320: item.node.thumbnail_resources[2].src,
                480: item.node.thumbnail_resources[3].src,
                640: item.node.thumbnail_resources[4].src
              }
            }));
          }).then(res => {
            const start = (+ops.s) || 0;
            const end = (+ops.n || 1) + start;
            return res.map(r => r.image)
              .slice(start, end);

          }).then((res: string[]) => {
            if (res.length > 10) {
              for (let i = 0; i < res.length / 10; i++) {
                const files = res.slice(i * 10, Math.min(i * 10 + 10, res.length));
                msg.channel.send('', { files: this.formatFiles(files) , split: true });
              }

              return msg.channel.send("Sending all");
            } else {
              return msg.channel.send('', { files: this.formatFiles(res), split: true });
            }
          }).then(() => {
            imsg.done();
          }).catch(err => {
            imsg.done(err, true);
          });
      }));
  }

  formatFiles(files) {
    return files.map(f => {
      const match = f.match(this._fileNameFinder);
      return {
        attachment: f,
        name: (match && match[0]) || f
      };
    });
  }

  getUrl(user: string) {
    return 'https://instagram.com/' + user + '/';
  }

  setupOptions(args: string[]): any {
    var argv = opt(args)
      .options('n', {
        alias: 'number',
        describe: 'specify the number of images to get',
        default: 1
      }).options('s', {
        alias: 'skip',
        describe: 'specify the number of images to skip',
        default: null
      }).options('h', {
        alias: 'help',
        describe: 'show this message',
        default: false
      });

    return argv;
  }

}