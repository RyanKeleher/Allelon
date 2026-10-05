import { timeAgo } from '../time';

describe('timeAgo', () => {
  const now = new Date('2026-10-05T12:00:00Z');
  it.each([
    ['2026-10-05T11:59:30Z', 'just now'],
    ['2026-10-05T11:55:00Z', '5m'],
    ['2026-10-05T09:00:00Z', '3h'],
    ['2026-10-03T12:00:00Z', '2d'],
  ])('%s -> %s', (iso, expected) => {
    expect(timeAgo(iso, now)).toBe(expected);
  });
});
