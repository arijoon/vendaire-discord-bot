import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';

import * as opt from 'optimist';

const MaxFileSize: number = 1024 * 1024 * 5; // 5MB

@injectable()
export class StyleImageCommand implements ICommand {

  _command: string = commands.image.style;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IHttp) private _http: IHttp,
    @inject(TYPES.IFiles) private _filesService: IFiles
  ) { }

  attach(): void {
    this._client
      .getCommandStream(this._command)
      .subscribe(imsg => this.subscription(imsg));
  }

  private subscription(imsg: IMessage) {
    const msg = imsg.Message;

    Promise.resolve().then(async _ => {

      const c = msg.content.trim();

      let argv = this.setupOptions(c.split(' '), imsg);
      let ops = argv.argv

      if (ops.h || !(ops.c && ops.s)) {
        return imsg.send(argv.help(), { code: 'md' });
      }

      const endpoint = this._config.app.api.imageStyle;

      const resultFilename = await this._http.get(`${endpoint}/style`, undefined,
        { content: ops.c, style: ops.s });

      const { data } = await this._http.getFile(`${endpoint}${resultFilename}`);

      return imsg.send("", {
        files: [{
          attachment: data,
          name: "result.png"
        }]
      });

    }).then(_ => {
      imsg.done();
    }).catch(err => {
      imsg.send("ooops, something went wrong", { reply: imsg.Message, code: err });
      imsg.done(err, true);
    });

  }


  setupOptions(args: string[], imsg: IMessage): any {
    var argv = opt(args)
      .usage(`Style an image, must provide content and style links`)
      .options('s', {
        alias: 'style',
        describe: 'link to the style',
      }).options('c', {
        alias: 'content',
        describe: 'link to the content',
        default: false
      }).options('h', {
        alias: 'help',
        describe: 'show this message',
      });

    return argv;
  }
}