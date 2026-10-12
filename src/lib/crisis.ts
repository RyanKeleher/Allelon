// A gentle safety net. If a request or response talks about suicide or
// self-harm, the app shows a card with crisis resources. It never blocks
// posting and never notifies anyone on the person's behalf.

const PATTERNS: RegExp[] = [
  // English
  /\bsuicid/i,
  /\bkill(ing)?\s+my\s?self\b/i,
  /\bend(ing)?\s+(it\s+all|my\s+life)\b/i,
  /\b(want|wanted|wanting)\s+to\s+die\b/i,
  /\bself[-\s]?harm/i,
  /\bhurt(ing)?\s+my\s?self\b/i,
  /\bcut(ting)?\s+my\s?self\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\bbetter\s+off\s+(dead|without\s+me)\b/i,
  // Spanish / Portuguese
  /\bsuicid/i,
  /\bquiero\s+morir/i,
  /\bquitarme\s+la\s+vida/i,
  /\bquero\s+morrer/i,
  /\btirar\s+(a\s+)?minha\s+(própria\s+)?vida/i,
  // French / German
  /\bme\s+tuer\b/i,
  /\benvie\s+de\s+mourir/i,
  /\bumbringen\b/i,
  /\bselbstmord/i,
  // Korean / Japanese / Chinese
  /자살|죽고\s?싶/,
  /自殺|死にたい/,
  /自杀|想死/,
];

export function mentionsSelfHarm(text: string | null | undefined): boolean {
  if (!text) return false;
  return PATTERNS.some((p) => p.test(text));
}

export type CrisisLine = { label: string; detail: string; url: string };

/** Lines for the person's country, with a worldwide directory as fallback. */
export function crisisLines(countryCode: string | null | undefined): CrisisLine[] {
  const directory: CrisisLine = {
    label: 'Find a helpline near you',
    detail: 'Free, confidential support in many countries',
    url: 'https://findahelpline.com',
  };
  switch ((countryCode ?? '').toUpperCase()) {
    case 'US':
    case 'CA':
      return [{ label: 'Call or text 988', detail: 'Suicide & Crisis Lifeline, 24/7', url: 'tel:988' }, directory];
    case 'GB':
    case 'IE':
      return [{ label: 'Call Samaritans: 116 123', detail: 'Free, 24/7', url: 'tel:116123' }, directory];
    case 'AU':
      return [{ label: 'Call Lifeline: 13 11 14', detail: '24/7 crisis support', url: 'tel:131114' }, directory];
    default:
      return [directory];
  }
}
