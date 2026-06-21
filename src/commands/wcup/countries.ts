interface CountryRaw {
  name: string;
  "alpha-2": string;
  "alpha-3": string;
  "country-code": string;
  "iso_3166-2": string;
  "region": string;
  "sub-region": string;
  "intermediate-region": string;
  "region-code": string;
  "sub-region-code": string;
  "intermediate-region-code": string;
}

interface ICountry {
  /**
   * Name of the country
   */
  name: string;
  /**
   * Two letter code
   */
  code: string;
  /**
   * Three letter code
   */
  code3: string;
  /**
   * Fifa code
   */
  fifa: string;
}

const countriesRaw: CountryRaw[] = require('./countries-all.json');
const fifaOverrides: { [isoKey: string]: string } = require('./fifa-to-iso.json');
const countries: { [name: string]: ICountry } = {}

for (let item of countriesRaw) {
  const fifa = fifaOverrides[item["alpha-3"]] || item["alpha-3"]
  countries[fifa] = {
    name: item.name,
    code: item["alpha-2"],
    code3: item["alpha-3"],
    fifa: fifa
  }
}

// The openfootball feed refers to teams by plain name. Most map straight onto
// the ISO 3166 country list below, but a handful use a different spelling.
const nameToIso: { [lowerName: string]: string } = {}
for (let item of countriesRaw) {
  nameToIso[item.name.toLowerCase()] = item["alpha-2"].toLowerCase()
}

// World Cup team name -> ISO alpha-2 for teams whose feed name doesn't match
// the ISO 3166 list exactly.
const flagNameOverrides: { [lowerName: string]: string } = {
  'bosnia & herzegovina': 'ba',
  'cape verde': 'cv',
  'czech republic': 'cz',
  'dr congo': 'cd',
  'iran': 'ir',
  'ivory coast': 'ci',
  'south korea': 'kr',
  'usa': 'us',
}

// UK home nations have no ISO flag emoji; Discord exposes them as their own
// regional shortcodes instead of :flag_xx:.
const specialFlags: { [lowerName: string]: string } = {
  'england': ':england:',
  'scotland': ':scotland:',
  'wales': ':wales:',
}

/**
 * Resolves a team name from the feed to a Discord flag emoji, or null when the
 * name is a knockout placeholder (e.g. "1A", "W74") that has no flag.
 */
function getFlag(teamName: string): string | null {
  if (!teamName) return null
  const key = teamName.toLowerCase().trim()

  if (specialFlags[key]) return specialFlags[key]

  const iso = flagNameOverrides[key] || nameToIso[key]
  return iso ? `:flag_${iso}:` : null
}

export { countries, ICountry, getFlag }