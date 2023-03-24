import { inject, injectable } from 'inversify';
import { TYPES } from '../ioc/types';
import { WebSocket } from 'ws';
import { hashName } from '../helpers';
import * as cheerio from 'cheerio';

// constant parameters
const params = {
    'max_new_tokens': 300,
    'do_sample': true,
    'temperature': 0.5,
    'top_p': 0.9,
    'typical_p': 1,
    'repetition_penalty': 1.05,
    'encoder_repetition_penalty': 1.0,
    'top_k': 0,
    'min_length': 0,
    'no_repeat_ngram_size': 0,
    'num_beams': 1,
    'penalty_alpha': 0,
    'length_penalty': 1,
    'early_stopping': false,
    'seed': -1,
}

@injectable()
export class TextGenApi implements IDependency {

  readonly baseUrl: string;
  readonly context: string;
  readonly charName: string;

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.Logger) private _logger: ILogger,
    @inject(TYPES.IHttp) private _http: IHttp
  ) {
    this.baseUrl = _config.api["textgenServer"];
    this.context = _config.app["textGenContext"]
    this.charName = _config.app["textGenName"]
  }

  getName() {
    return TextGenApi.name;
  }

  poll() {
    // const url = this.url("/poll");
    return Promise.resolve()
  }

  async genText(prompt: string, author?: string): Promise<string> {
    const body = {
      data: [
        prompt,
        params['max_new_tokens'],
        params['do_sample'],
        params['temperature'],
        params['top_p'],
        params['typical_p'],
        params['repetition_penalty'],
        params['encoder_repetition_penalty'],
        params['top_k'],
        params['min_length'],
        params['no_repeat_ngram_size'],
        params['num_beams'],
        params['penalty_alpha'],
        params['length_penalty'],
        params['early_stopping'],
        params['seed'],
        'You',
        this.charName,
        this.context,
        false,
        2048,
        1
      ]
    }

    // Constant session name for now
    const session = author ? hashName(author) : 'brobot111'
    const sessionData = {
      "session_hash": session,
      "fn_index": 12
    }

    const url = this.url("/queue/join");
    // very dirty websocket solution, clean this up
    // using a bracket pattern in th future
    return new Promise((resolve, reject) => {
      let isResolved = false
      const ws = new WebSocket(url);
      ws.on('error', reject)
      ws.on('message', (message) => {
        const command: { msg: string } = JSON.parse(message.toString())
        switch (command.msg) {
          case "send_hash": 
            return ws.send(JSON.stringify(sessionData))
          case "send_data":
            return ws.send(JSON.stringify({...sessionData, ...body}))
          case "process_completed":
            isResolved = true
            ws.close()
            const result = (command as any).output.data[0]
            return resolve(this.parseResult(result))
          default:
            this._logger.info('Default case', command.msg)
        }
      })

      // Force close the websocket if it isn't resolved
      setTimeout(() => {
        if (!isResolved) {
          ws.close()
          reject()
        }
      }, 10_000)
    })
  }

  private parseResult(result: string): string {
    const $ = cheerio.load(result);
    const allMatches = $('.message-body p')
    const botResponse = allMatches
    .first().html();

    // convert italic to discord version
    return botResponse
      .replace(/<\/?em>/g, '*')
  }

  private url(url) {
    return `${this.baseUrl}${url}`
  }
}