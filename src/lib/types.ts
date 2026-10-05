import type { Database } from '@/types/database';

type Tables = Database['public']['Tables'];
type Views = Database['public']['Views'];

export type Profile = Tables['profiles']['Row'];
export type Follow = Tables['follows']['Row'];
export type Passion = Tables['passions']['Row'];
export type Country = Tables['countries']['Row'];
export type Response = Tables['responses']['Row'];
export type RequestKind = Database['public']['Enums']['request_kind'];

export type AudienceChoice = 'followers' | 'close_friends' | 'world';

export type CardAudience = {
  type: 'followers' | 'close_friends' | 'group' | 'world';
  group_id: string | null;
  group_name: string | null;
};

// request_cards columns are all nullable in generated view types; the ones
// below are never null in practice, so the card type narrows them.
type RawCard = Views['request_cards']['Row'];
export type RequestCard = Omit<RawCard, 'id' | 'body' | 'kind' | 'created_at' | 'audiences'> & {
  id: string;
  body: string;
  kind: RequestKind;
  created_at: string;
  audiences: CardAudience[];
};

export function toCard(row: RawCard): RequestCard {
  return row as unknown as RequestCard;
}
