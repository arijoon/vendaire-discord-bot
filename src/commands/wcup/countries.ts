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

export { countries, ICountry }