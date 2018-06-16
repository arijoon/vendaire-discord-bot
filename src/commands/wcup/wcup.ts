import { injectable, inject } from 'inversify';
import { IMessage } from '.././../contracts';
import { IClient } from '../../contracts';
import { TYPES } from '../../ioc/types';
import { commands } from '../../static';
import { countries } from './countries';
import * as moment from 'moment';
import { ITeam } from './api-contracts';

const secondsTillEndOfDay = () => Math.ceil((-new Date() + new Date().setHours(24,0,0,0))/1e3);
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
      'country': 'picks a daily country for you from teams playing',
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
        case 'matches t':
        case 'matches tomorrow':
          return this.matches('tomorrow');
        case 'country':
          return this.country(imsg.userId);
        case 'groups':
          return this.groups();
        case 'team':
          return this.team();
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

    const messages: string[] = ['Matches'];

    for(let item of data) {
      const home = item["home_team"];
      const away = item["away_team"];
      let message = `:flag_${this.getIsoCode(home.code)}: vs :flag_${this.getIsoCode(away.code)}: at ${this.getTimeString(item.datetime)}`;
      if(item.winner) {
        message += ` (${home.goals} : ${away.goals})`;
      }

      messages.push(message);
    }

    return messages.join('\n');
  }

  private async country(uuid: string) {
    // if the user already has a country for the day, return it
    let isoCode: string;
    const key = `${this._command}::country:uuid:${uuid}`;

    if (await this._cache.has(key)) {
      isoCode = await this._cache.get(key);
    } else {

      // Get all teams for today
      const suffix = '/matches/today';
      const data: any[] = await this.fetch(suffix, secondsTillEndOfDay(), 'country');
      const countryCodes: string[] = []

      for (let item of data) {
        countryCodes.push(this.getIsoCode(item["home_team"].code));
        countryCodes.push(this.getIsoCode(item["away_team"].code));
      }

      isoCode = countryCodes.popRandom();
      await this._cache.set(key, isoCode, secondsTillEndOfDay());
    }

    return `:flag_${isoCode}:`.repeat(Math.ceil(Math.random() * 30));
  }

  private async groups() {
    const suffix = '/teams/group_results';

    const data: any[] = await this.fetch(suffix, 60*60);
    const messages: string[] = ['Groups'];

    for(let item of data) {
      const group = item.group;
      let message = `:regional_indicator_${group.letter.toLowerCase()}:\t`
      for(let teams of group.teams) {
        const team = teams.team;
        message += `:flag_${this.getIsoCode(team.fifa_code)}: ${team.points} \t`
      }

      messages.push(message);
    }

    return messages.join('\n');
  }

  private async team() {
    const suffix = '/teams';

    const data: ITeam[] = await this.fetch(suffix, secondsInFullDay);

    const team = data.crandom();
    const flag = `:flag_${this.getIsoCode(team.fifa_code)}:`;

    return `**${team.country}** ${flag.repeat(3)}`
  }

  private async fetch(suffix: string, expiry: number, extraKey?: string) {
    const key = `${this._command}::${extraKey ? `${extraKey}:` : ''}${suffix}`;
    if (await this._cache.has(key)) {
      return JSON.parse(await this._cache.get(key));
    }

    const result = await this._http.getJson(this._api + suffix);

    this._cache.set(key, JSON.stringify(result), expiry);

    return result;
  }

  private getIsoCode(fifaCode: string) {
    const country = countries[fifaCode]
    if (!country) {
      throw new Error(`country not found for Fifa code: ${fifaCode}`);
    }
    return country.code.toLowerCase()
  }

  private getTimeString(dateTime: string) {
    const date = moment(dateTime);
    date.locale('en');
    if (!date.isDST())
      date.add(1, 'hour'); // will be ahead of UTC

    return date.format('LT');
  }
}