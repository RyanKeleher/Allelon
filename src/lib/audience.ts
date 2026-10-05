import type { AudienceChoice } from './types';

export type AudienceSelection = {
  audiences: AudienceChoice[];
  groupIds: string[];
  anonymous: boolean;
};

export const DEFAULT_SELECTION: AudienceSelection = {
  audiences: ['followers'],
  groupIds: [],
  anonymous: false,
};

const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

/** Anonymity is only offered when the post goes to the World and nobody else. */
export function canBeAnonymous(s: AudienceSelection): boolean {
  return s.audiences.length === 1 && s.audiences[0] === 'world' && s.groupIds.length === 0;
}

function normalize(s: AudienceSelection): AudienceSelection {
  return canBeAnonymous(s) ? s : { ...s, anonymous: false };
}

export function toggleAudience(s: AudienceSelection, choice: AudienceChoice): AudienceSelection {
  return normalize({ ...s, audiences: toggle(s.audiences, choice) });
}

export function toggleGroup(s: AudienceSelection, groupId: string): AudienceSelection {
  return normalize({ ...s, groupIds: toggle(s.groupIds, groupId) });
}

export function setAnonymous(s: AudienceSelection, anonymous: boolean): AudienceSelection {
  return { ...s, anonymous: anonymous && canBeAnonymous(s) };
}

export function hasAudience(s: AudienceSelection): boolean {
  return s.audiences.length + s.groupIds.length > 0;
}

/** Plain-language summary for the post button's accessibility hint and the confirmation line. */
export function describeSelection(s: AudienceSelection, groupNames: Record<string, string>): string {
  const parts: string[] = [];
  if (s.audiences.includes('followers')) parts.push('your followers');
  if (s.audiences.includes('close_friends')) parts.push('your close friends');
  for (const id of s.groupIds) parts.push(groupNames[id] ?? 'a group');
  if (s.audiences.includes('world')) parts.push(s.anonymous ? 'the World, anonymously' : 'the World');
  if (parts.length === 0) return 'Choose who to share with';
  if (parts.length === 1) return `Shared with ${parts[0]}`;
  return `Shared with ${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}
