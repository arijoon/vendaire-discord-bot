import { injectable, inject } from 'inversify';
import { IMessage } from '.././../contracts';
import { IClient } from '../../contracts';
import { TYPES } from '../../ioc/types';
import { commands } from '../../static';
import { countries } from './countries';

const secondsTillEndOfDay = () => (-new Date() + new Date().setHours(24,0,0,0))/1e3;
const secondsInFullDay = 24*60*60;

@injectable()
export class WorldCupCommand implements ICommand, IHasHelp {

  _command: string = commands.wcup;
  _patterns = ['Wins', 'Spares'];
  _api: string;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IHttp) private _http: IHttp,
    @inject(TYPES.IBasicCache) private _cache: IBasicCache,
  ) {
    this._api = _config.api['wcup'];
   }

  attach(): void {
    this._client
      .getCommandStream(this._command)
      .subscribe(imsg => this.subscription(imsg));
  }

  getHelp(): IHelp[] {
    const commands = {
      'matches': 'shows the matches of the day',
      'country': 'picks a daily country for you',
      'flag': 'post a flag of a country in World Cup'
    }
    return [{
      Key: this._command,
      Message: 'World cup actions',
      Usage: `${this._command} [COMMAND]\nCommands:\n${Object.keys(commands).map(c => `\t${c}:\t${commands[c]}`).join('\n')}`
    }];
  }

  private subscription(imsg: IMessage) {
    Promise.resolve().then(async _ => {

      const content = imsg.Content.trim();

      switch(content) {
        case 'matches':
        case 'matches today':
          return this.matches('today');
        case 'matches tomorrow':
          return this.matches('tomorrow');
        default: 
          return this.getHelp()[0].Usage;
      }

    }).then(async response => {
      await imsg.send(response);
      return imsg.done();
    }).catch(err => {
      imsg.done(err, true)});
  }

  private async matches(day: string) {
    const suffix = `/matches/${day}`;
    const data = await this.fetch(suffix, 60);

    const messages: string[] = [];

    for(let item of data) {
      const home = item["home_team"];
      const away = item["away_team"];
      let message = `:flag_${this.getIsoCode(home.code)}: vs :flag_${this.getIsoCode(away.code)}: at ${(new Date(item.datetime)).toLocaleTimeString('en-GB')}`;
      if(item.winner) {
        message += ` (${home.goals} : ${away.goals})`;
      }

      messages.push(message);
    }

    return messages.join('\n');
  }

  private async country() {
    // TODO

  }

  private async flag() {
    // TODO
  }

  private async fetch(suffix: string, expiry: number) {
    const key = `${this._command}::${suffix}`;
    if (await this._cache.has(key)) {
      return JSON.parse(await this._cache.get(key));
    }

    const result = this._http.getJson(this._api + suffix);

    this._cache.set(key, JSON.stringify(result), expiry);

    return result;
  }

  private getIsoCode(fifaCode: string) {
      const country = countries[fifaCode]
      if(!country) {
        throw new Error(`country not found for Fifa code: ${fifaCode}`);
      }
      return country.code.toLowerCase()
  }
}