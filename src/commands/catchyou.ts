import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { makeSubscription } from '../helpers/command';
import * as path from 'path';
import { spawn } from 'child_process';
import { cmdSanatize } from '../helpers';

const filePatterns: RegExp = new RegExp(`\.(${['mp4'].join("|")})$`)

const quoteColor = '#789922';
const fontSize = 32;

@injectable()
export class CatchYou implements ICommand, IHasHelp {

  _command: string = commands.catchyou;
  _fontPath: string

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IFiles) private _filesService: IFiles,
    @inject(TYPES.Logger) private _logger: ILogger,
  ) {

    // Move to font service
    this._fontPath = this._config.pathFromRoot(this._config.app.assets.root, "fonts", "impact.ttf",);
  }

  attach(): void {
    makeSubscription(this._client.getCommandStream(this._command),
      this.subscription.bind(this))
  }

  private async subscription(imsg: IMessage): Promise<any> {

    const content = imsg.Content;
    const [videoFile, data] = await this.selectRandomFile();

    const buffers = [];
    const process = spawn("ffmpeg", this.ffmpegargs(videoFile, this._fontPath, data.caption, content));
    await new Promise((r,x) => {
      const errors = [];
      process.on("close", (code) => {
        this._logger.info(`finished ffmpeg(${code}) processing of ${videoFile}`)
        if (code > 0){
          errors.forEach((e) => this._logger.error(e));
          x(code);
        } 
        else r();
      });
      process.on("error", (err) => this._logger.error("Failed in ffmpeg", err));

      process.stderr.on("data", (data) => {
        errors.push(data);
      });
      process.stdout.on('data', (chunk) => {
        buffers.push(chunk);
      });
    });

    const resultFile = Buffer.concat(buffers);

    return imsg.send('', { files: [
      {
        attachment: resultFile,
        name: "catchyou.mp4"
      }
    ]});
  }

  ffmpegargs(filename, fontfile, text, content) {
    let caption = cmdSanatize(text
      .replace("$content", content));
    const drawtext = `text='${caption}' :fontfile=${fontfile}: fontcolor=white: fontsize=${fontSize}: box=1:x=(w-text_w)/2: y=(h-text_h): boxcolor=black@0.4`

    
    return ["-i", filename, "-f", "webm", "-an", "-vf", `drawtext='${drawtext}'`, "pipe:1"];
  }

  async selectRandomFile(): Promise<[string, any]> {
    const fullPath = path.join(this._config.images["root"], 'catchyou');

    const lst = await this._filesService
      .getAllFiles(fullPath, { recursive: true, include: filePatterns })

    const videoFile = lst.crandom();
    const dataFile = videoFile.replace("mp4", "json");
    const data = await this._filesService.readFile(path.join(fullPath, dataFile))
    return [this._config.pathFromRoot(fullPath, videoFile), JSON.parse(data)];
  }

  getHelp(): IHelp[] {
    return [
      {
        Key: this._command,
        Message: "Create a video with the caption",
        Usage: `trying to be`
      }
    ]
  }
}