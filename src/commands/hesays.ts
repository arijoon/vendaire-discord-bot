import { IMessage } from '../contracts';
import { IClient } from '../contracts';
import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';
import { commands } from '../static';
import { makeSubscription } from '../helpers/command';
import * as path from 'path';
import { createCanvas, registerFont, loadImage } from 'canvas';
import { calculateSize } from '../helpers';

const filePatterns: RegExp = new RegExp(`\.(${['jpeg', 'jpg', 'png'].join("|")})$`)

const quoteColor = '#789922';
const bgColor = '#ffffff';
const fontSize = 48;
const font = `${fontSize}px "Impact"`;
const maxHeight = 720;

@injectable()
export class HeSays implements ICommand, IHasHelp {

  _command: string = commands.hesays;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IFiles) private _filesService: IFiles,
    @inject(TYPES.Logger) private _logger: ILogger,
  ) {

    // Move to font service
    const fontPath = this._config.pathFromRoot(this._config.app.assets.root, "fonts", "impact.ttf",);
    registerFont(fontPath, { family: "Impact" });
  }

  attach(): void {
    makeSubscription(this._client.getCommandStream(this._command),
      this.subscription.bind(this))
  }

  private async subscription(imsg: IMessage): Promise<any> {

    const content = imsg.Content;
    const imagePath = await this.selectRandomFile();

    const canvas = createCanvas(200, 200);

    const img = await loadImage(imagePath);
    const [width, height] = calculateSize(img.width, img.height, maxHeight);
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    ctx.font = font;
    let lines = this.countLines(ctx, content, width);
    canvas.height = canvas.height + (lines + 1) * fontSize + 15

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = font;
    ctx.fillStyle = quoteColor;
    this.wrapText(ctx, content, 0, height + fontSize, width, fontSize);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, width, height);

    return imsg.send('', { files: [canvas.toBuffer('image/jpeg')] });
  }

  countLines(context, text, maxWidth) {
    let words = text.split(' ');
    let linesN = 0;
    let line = '';

    for (let i = 0; i < words.length; i++) {
      line += ' ' + words[i];
      let metrics = context.measureText(line);
      if (metrics.width > maxWidth) {
        linesN++;
        line = words[i]; // last word pushed to the next line
      }
    }

    return linesN;
  }

  wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    context.fillStyle = 'white';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.font = font;
        context.strokeStyle = 'black';
        context.lineWidth = 10;

        let xm = this.centerText(context, line, maxWidth);
        context.strokeText(line, xm, y)
        context.fillText(line, xm, y);
        line = words[n] + ' ';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    const xm = this.centerText(context, line, maxWidth);
    context.strokeText(line, xm, y)
    context.fillText(line, xm, y);
  }

  centerText(context, text, maxWidth) {
    let testWidth = context.measureText(text).width;
    return ((maxWidth - testWidth) / 2);
  }

  selectRandomFile(): Promise<string> {
    const fullPath = path.join(this._config.images["root"], 'randompic', 'pichesays');

    return this._filesService
      .getAllFiles(fullPath, { recursive: true, include: filePatterns })
      .then(lst => {
        return this._config.pathFromRoot(fullPath, lst.crandom());
      });
  }

  getHelp(): IHelp[] {
    return [
      {
        Key: this._command,
        Message: "Create a reaction pic from 'pichesays' image folder",
        Usage: `orange man bad p-pls believe me`
      }
    ]
  }
}