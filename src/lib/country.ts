// Country code to flag emoji
export function countryToFlag(countryCode: string): string {
  if (!countryCode || countryCode === 'UN') return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Country code to name
const countryNames: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', DE: 'Germany', FR: 'France',
  JP: 'Japan', BR: 'Brazil', IN: 'India', CA: 'Canada', AU: 'Australia',
  KR: 'South Korea', MX: 'Mexico', ES: 'Spain', IT: 'Italy', NL: 'Netherlands',
  SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', PL: 'Poland',
  RU: 'Russia', CN: 'China', TR: 'Turkey', AR: 'Argentina', CL: 'Chile',
  CO: 'Colombia', EG: 'Egypt', ZA: 'South Africa', NG: 'Nigeria', KE: 'Kenya',
  PH: 'Philippines', TH: 'Thailand', VN: 'Vietnam', ID: 'Indonesia', MY: 'Malaysia',
  SG: 'Singapore', NZ: 'New Zealand', PT: 'Portugal', IE: 'Ireland', CH: 'Switzerland',
  AT: 'Austria', BE: 'Belgium', CZ: 'Czech Republic', RO: 'Romania', UA: 'Ukraine',
  UN: 'Unknown',
};

export function countryName(code: string): string {
  return countryNames[code?.toUpperCase()] || code || 'Unknown';
}

// Detect country via IP
export async function detectCountry(): Promise<string> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return data.country_code || 'UN';
  } catch {
    return 'UN';
  }
}
