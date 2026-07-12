/**
 * Shape of the openfootball World Cup JSON feed.
 * See https://github.com/openfootball/worldcup.json (public domain, no API key).
 */
export interface IWorldCup {
  name: string;
  matches: IMatch[];
}

export interface IMatch {
  round: string;
  num?: number;
  /** ISO calendar date of the match, e.g. "2026-06-11" */
  date: string;
  /** Local kickoff time incl. utc offset, e.g. "13:00 UTC-6" */
  time: string;
  /** Team name, or a placeholder for knockout slots e.g. "1A", "W74" */
  team1: string;
  team2: string;
  /** Only present once the match has been played */
  score?: {
    ft: [number, number];
    ht?: [number, number];
    et?: [number, number];
    p?: [number, number];
  };
  /** e.g. "Group A" for the group stage, absent for knockout rounds */
  group?: string;
  ground: string;
}
