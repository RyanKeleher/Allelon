import { crisisLines, mentionsSelfHarm } from '../crisis';

describe('mentionsSelfHarm', () => {
  it.each([
    'I keep thinking about suicide',
    'Some days I want to die',
    'I have been hurting myself again',
    'Quiero morir',
    '죽고 싶어요',
  ])('flags %s', (text) => expect(mentionsSelfHarm(text)).toBe(true));

  it.each([
    'Pray for my exams',
    'My grandmother died last week',
    'This job is killing me (ha)',
    'Die Gemeinde trifft sich am Sonntag',
  ])('does not flag %s', (text) => expect(mentionsSelfHarm(text)).toBe(false));
});

describe('crisisLines', () => {
  it('gives 988 in the US and a directory everywhere', () => {
    expect(crisisLines('US')[0].url).toBe('tel:988');
    expect(crisisLines('BR').map((l) => l.url)).toEqual(['https://findahelpline.com']);
  });
});
