-- Reference data. Runs on `supabase db reset` (local only).

insert into public.passions (id, label, icon, sort_order) values
  ('family', 'Family', '🏠', 1),
  ('faith', 'Faith', '✝️', 2),
  ('health', 'Health', '🌿', 3),
  ('work', 'Work', '💼', 4),
  ('school', 'School', '📚', 5),
  ('peace', 'Peace', '🕊️', 6),
  ('finances', 'Finances', '🌱', 7),
  ('community', 'Community', '🤝', 8),
  ('sports', 'Sports', '⚽', 9),
  ('creativity', 'Creativity', '🎨', 10)
on conflict (id) do nothing;

-- Countries (with globe coordinates) are inserted by migration 20261009000001_world.sql.
