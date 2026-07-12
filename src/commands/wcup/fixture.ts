import * as moment from 'moment';
import { IMatch } from './api-contracts';

export interface IFixture {
  at: moment.Moment;
  time: string;
}

/**
 * Parses a feed match into a British-local kickoff: the moment `at` (used for
 * sorting and the date) and a display `time` like "18:00 BST"/"15:00 GMT".
 * The feed time ("17:00 UTC-4") has its offset baked in; unknown formats fall
 * back to the raw time on the match date.
 */
export function toUkFixture(m: IMatch): IFixture {
  const parsed = /^(\d{1,2}):(\d{2})\s*UTC([+-]\d{1,2})(?::(\d{2}))?/.exec(m.time);
  if (!parsed) {
    return { at: moment.utc(m.date, 'YYYY-MM-DD'), time: m.time };
  }

  const [, hh, mm, offH, offM] = parsed;
  const sign = offH.startsWith('-') ? -1 : 1;
  const offsetMin = parseInt(offH, 10) * 60 + sign * (offM ? parseInt(offM, 10) : 0);

  // Clock time at the source offset → true UTC instant → British local.
  const utc = moment.utc(`${m.date} ${hh}:${mm}`, 'YYYY-MM-DD H:mm').subtract(offsetMin, 'minutes');
  const bst = isBst(utc);
  const at = utc.add(bst ? 60 : 0, 'minutes');

  return { at, time: `${at.format('HH:mm')} ${bst ? 'BST' : 'GMT'}` };
}

/** Whether a UTC instant falls within British Summer Time. */
function isBst(utc: moment.Moment): boolean {
  const year = utc.year();
  // BST runs from 01:00 UTC on the last Sunday of March to 01:00 UTC on the
  // last Sunday of October.
  const start = lastSundayUtc(year, 2, 1);
  const end = lastSundayUtc(year, 9, 1);
  return utc.isSameOrAfter(start) && utc.isBefore(end);
}

/** 0-indexed month → moment for the last Sunday of that month at hourUtc:00 UTC. */
function lastSundayUtc(year: number, month: number, hourUtc: number): moment.Moment {
  const lastDay = moment.utc([year, month, 1]).endOf('month');
  lastDay.subtract(lastDay.day(), 'days'); // step back to the Sunday on/before
  return moment.utc([year, month, lastDay.date(), hourUtc]);
}
