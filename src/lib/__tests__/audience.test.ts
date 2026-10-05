import {
  DEFAULT_SELECTION,
  canBeAnonymous,
  describeSelection,
  hasAudience,
  setAnonymous,
  toggleAudience,
  toggleGroup,
} from '../audience';

describe('audience selection', () => {
  it('defaults to all followers', () => {
    expect(DEFAULT_SELECTION.audiences).toEqual(['followers']);
    expect(hasAudience(DEFAULT_SELECTION)).toBe(true);
  });

  it('toggles audiences on and off', () => {
    const s = toggleAudience(DEFAULT_SELECTION, 'close_friends');
    expect(s.audiences).toEqual(['followers', 'close_friends']);
    expect(toggleAudience(s, 'followers').audiences).toEqual(['close_friends']);
  });

  it('requires at least one audience', () => {
    expect(hasAudience(toggleAudience(DEFAULT_SELECTION, 'followers'))).toBe(false);
    expect(hasAudience(toggleGroup(toggleAudience(DEFAULT_SELECTION, 'followers'), 'g1'))).toBe(true);
  });

  it('only allows anonymity for World-only posts', () => {
    const worldOnly = toggleAudience(toggleAudience(DEFAULT_SELECTION, 'followers'), 'world');
    expect(canBeAnonymous(worldOnly)).toBe(true);
    expect(setAnonymous(worldOnly, true).anonymous).toBe(true);
    expect(setAnonymous(DEFAULT_SELECTION, true).anonymous).toBe(false);
  });

  it('drops anonymity when another audience is added', () => {
    const anon = setAnonymous(toggleAudience(toggleAudience(DEFAULT_SELECTION, 'followers'), 'world'), true);
    expect(toggleAudience(anon, 'followers').anonymous).toBe(false);
    expect(toggleGroup(anon, 'g1').anonymous).toBe(false);
  });

  it('describes the selection in plain language', () => {
    const s = toggleGroup(toggleAudience(DEFAULT_SELECTION, 'close_friends'), 'g1');
    expect(describeSelection(s, { g1: 'Thursday Bible Study' })).toBe(
      'Shared with your followers, your close friends and Thursday Bible Study',
    );
  });
});
