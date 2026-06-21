import { injectable, inject } from 'inversify';
import { IMessage } from '.././../contracts';
import { IClient } from '../../contracts';
import { TYPES } from '../../ioc/types';
import { commands } from '../../static';
import { getFlag } from './countries';
import * as moment from 'moment';
import { IMatch, IWorldCup } from './api-contracts';

const secondsTillEndOfDay = () => Math.ceil((-new Date() + new Date().setHours(24, 0, 0, 0)) / 1e3);
const HOUR = 60 * 60;

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
      'matches [today|tomorrow]': 'shows the matches of the day',
      'country': 'picks a daily country for you from teams playing',
      'groups': 'shows the group standings',
      'team': 'picks a random team from the tournament'
    }
    return [{
      Key: this._command,
      Message: 'World cup actions',
      Usage: `${this._command} [COMMAND]\nCommands:\n${Object.keys(commands).map(c => `\t${c}:\t${commands[c]}`).join('\n')}`
    }];
  }

  private subscription(imsg: IMessage) {
    Promise.resolve().then(async _ => {

      const content = imsg.Content;

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
    const target = day === 'tomorrow' ? moment().add(1, 'day') : moment();
    const dateStr = target.format('YYYY-MM-DD');

    const matches = (await this.fetchMatches()).filter(m => m.date === dateStr);

    if (!matches.length) {
      return `No matches ${day}`;
    }

    const messages: string[] = [`**Matches ${day}**`];

    for (const item of matches) {
      let message = `${this.label(item.team1)} vs ${this.label(item.team2)} at ${item.time}`;
      if (item.score) {
        message += ` (${item.score.ft[0]} : ${item.score.ft[1]})`;
      }

      messages.push(message);
    }

    return messages.join('\n');
  }

  private async country(uuid: string) {
    // if the user already has a country for the day, return it
    const key = `${this._command}::country:uuid:${uuid}`;

    let flag: string;
    if (await this._cache.has(key)) {
      flag = await this._cache.get(key);
    } else {
      const matches = await this.fetchMatches();
      const dateStr = moment().format('YYYY-MM-DD');

      // teams playing today, falling back to the whole tournament out of season
      let flags = this.distinctFlags(matches.filter(m => m.date === dateStr));
      if (!flags.length) {
        flags = this.distinctFlags(matches);
      }

      flag = flags.popRandom();
      await this._cache.set(key, flag, secondsTillEndOfDay());
    }

    return flag.repeat(Math.ceil(Math.random() * 30));
  }

  private async groups() {
    const matches = await this.fetchMatches();

    // groupLetter -> teamName -> standing
    const table: { [letter: string]: { [team: string]: { pts: number, gd: number } } } = {};

    for (const m of matches) {
      if (!m.group || !getFlag(m.team1) || !getFlag(m.team2)) continue;

      const letter = m.group.replace(/^Group\s+/i, '').trim();
      const group = table[letter] || (table[letter] = {});
      const home = group[m.team1] || (group[m.team1] = { pts: 0, gd: 0 });
      const away = group[m.team2] || (group[m.team2] = { pts: 0, gd: 0 });

      if (m.score) {
        const [h, a] = m.score.ft;
        home.gd += h - a;
        away.gd += a - h;
        if (h > a) home.pts += 3;
        else if (a > h) away.pts += 3;
        else { home.pts++; away.pts++; }
      }
    }

    const messages: string[] = ['**Groups**'];

    for (const letter of Object.keys(table).sort()) {
      const teams = Object.keys(table[letter])
        .sort((x, y) => table[letter][y].pts - table[letter][x].pts || table[letter][y].gd - table[letter][x].gd);

      let message = `:regional_indicator_${letter.toLowerCase()}:\t`;
      // Wrap points in inline code so Discord renders them monospace (equal-width
      // digits), keeping the columns aligned across rows.
      message += teams.map(t => `${getFlag(t)} \`${table[letter][t].pts}\``).join(' \t');
      messages.push(message);
    }

    return messages.join('\n');
  }

  private async team() {
    const flags = this.distinctFlags(await this.fetchMatches());
    return flags.crandom().repeat(3);
  }

  private async fetchMatches(): Promise<IMatch[]> {
    const key = `${this._command}::matches`;
    if (await this._cache.has(key)) {
      return JSON.parse(await this._cache.get(key));
    }

    const result: IWorldCup = await this._http.getJson(this._api);
    const matches = result.matches || [];

    this._cache.set(key, JSON.stringify(matches), HOUR);

    return matches;
  }

  /** Distinct flag emojis for every real team appearing in the given matches. */
  private distinctFlags(matches: IMatch[]): string[] {
    const flags = new Set<string>();
    for (const m of matches) {
      const home = getFlag(m.team1);
      const away = getFlag(m.team2);
      if (home) flags.add(home);
      if (away) flags.add(away);
    }
    return [...flags];
  }

  /** Renders a team as "<flag> <name>", or just the name for knockout placeholders. */
  private label(teamName: string): string {
    const flag = getFlag(teamName);
    return flag ? `${flag} ${teamName}` : teamName;
  }
}
