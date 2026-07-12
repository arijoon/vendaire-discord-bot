import { injectable, inject } from 'inversify';
import { IMessage } from '.././../contracts';
import { IClient } from '../../contracts';
import { TYPES } from '../../ioc/types';
import { commands } from '../../static';
import { getFlag } from './countries';
import * as moment from 'moment';
import { registerFont } from 'canvas';
import { IMatch, IWorldCup } from './api-contracts';
import { renderBracket, BRACKET_FONT, FlagCache } from './bracket';

const secondsTillEndOfDay = () => Math.ceil((-new Date() + new Date().setHours(24, 0, 0, 0)) / 1e3);
const HOUR = 60 * 60;

@injectable()
export class WorldCupCommand implements ICommand, IHasHelp {

  _command: string = commands.wcup;
  _patterns = ['Wins', 'Spares'];
  _api: string;
  private _flagCache: FlagCache;

  constructor(
    @inject(TYPES.IClient) private _client: IClient,
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IHttp) private _http: IHttp,
    @inject(TYPES.IBasicCache) private _cache: IBasicCache,
  ) {
    this._api = _config.api['wcup'];
    this._flagCache = new Map();
    const fontPath = _config.pathFromRoot(_config.app.assets.root, 'fonts', 'AnticSans.otf');
    registerFont(fontPath, { family: BRACKET_FONT });
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
      'team': 'picks a random team from the tournament',
      'diagram': 'renders the knockout bracket from the round of 16'
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
        case 'diagram':
        case 'bracket':
          return this.diagram(imsg);
        default:
          return this.getHelp()[0].Usage;
      }

    }).then(async response => {
      if (response !== undefined) await imsg.send(response);
      return imsg.done();
    }).catch(err => {
      imsg.done(err, true)});
  }

  private async matches(day: string) {
    const target = day === 'tomorrow' ? moment().add(1, 'day') : moment();
    const dateStr = target.format('YYYY-MM-DD');

    const matches = (await this.fetchMatches())
      .filter(m => m.date === dateStr)
      .map(m => this.toFixture(m))
      .sort((a, b) => a.at.valueOf() - b.at.valueOf());

    if (!matches.length) {
      return `No matches ${day}`;
    }

    const messages: string[] = [`**Matches ${day}**`];

    for (const { match: item, at, time } of matches) {
      let message = `${this.label(item.team1)} vs ${this.label(item.team2)} on ${this.ordinalDay(at)} at ${time}`;
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

  private async diagram(imsg: IMessage): Promise<undefined> {
    const buffer = await renderBracket(await this.fetchMatches(), this._flagCache);
    if (!buffer) {
      await imsg.send('The knockout bracket is not available yet');
      return undefined;
    }

    await imsg.send('', { files: [{ attachment: buffer, name: 'knockout.png' }] });
    return undefined;
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

  /**
   * Parses a feed match into a British-local kickoff: the moment `at` (used for
   * sorting and the date) and a display `time` like "18:00 BST"/"15:00 GMT".
   * The feed time ("17:00 UTC-4") has its offset baked in; unknown formats fall
   * back to the raw time on the match date.
   */
  private toFixture(m: IMatch): { match: IMatch, at: moment.Moment, time: string } {
    const parsed = /^(\d{1,2}):(\d{2})\s*UTC([+-]\d{1,2})(?::(\d{2}))?/.exec(m.time);
    if (!parsed) {
      return { match: m, at: moment.utc(m.date, 'YYYY-MM-DD'), time: m.time };
    }

    const [, hh, mm, offH, offM] = parsed;
    const sign = offH.startsWith('-') ? -1 : 1;
    const offsetMin = parseInt(offH, 10) * 60 + sign * (offM ? parseInt(offM, 10) : 0);

    // Clock time at the source offset → true UTC instant → British local.
    const utc = moment.utc(`${m.date} ${hh}:${mm}`, 'YYYY-MM-DD H:mm').subtract(offsetMin, 'minutes');
    const bst = this.isBst(utc);
    const at = utc.add(bst ? 60 : 0, 'minutes');

    return { match: m, at, time: `${at.format('HH:mm')} ${bst ? 'BST' : 'GMT'}` };
  }

  /** Day of month with an ordinal suffix, e.g. "1st", "3rd", "24th". */
  private ordinalDay(at: moment.Moment): string {
    const d = at.date();
    const rem100 = d % 100;
    const suffix = rem100 >= 11 && rem100 <= 13 ? 'th'
      : ['th', 'st', 'nd', 'rd'][d % 10] || 'th';
    return `${d}${suffix}`;
  }

  /** Whether a UTC instant falls within British Summer Time. */
  private isBst(utc: moment.Moment): boolean {
    const year = utc.year();
    // BST runs from 01:00 UTC on the last Sunday of March to 01:00 UTC on the
    // last Sunday of October.
    const start = this.lastSundayUtc(year, 2, 1);
    const end = this.lastSundayUtc(year, 9, 1);
    return utc.isSameOrAfter(start) && utc.isBefore(end);
  }

  /** 0-indexed month → moment for the last Sunday of that month at hourUtc:00 UTC. */
  private lastSundayUtc(year: number, month: number, hourUtc: number): moment.Moment {
    const lastDay = moment.utc([year, month, 1]).endOf('month');
    lastDay.subtract(lastDay.day(), 'days'); // step back to the Sunday on/before
    return moment.utc([year, month, lastDay.date(), hourUtc]);
  }
}
