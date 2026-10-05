# Allelon

This project was inspired by, and built with the help of, Allie Bates, a close friend of mine. Her vision was a social platform for Christians where people can post and respond to prayer requests, privately or publicly.

Allelon helps people pray for each other on purpose, follow through, and see over time what God does. It is built with React Native (Expo) and Supabase.

## Project layout

```
src/app/              screens (Expo Router): (auth), onboarding, (tabs), compose, request/[id], profile/[id], ...
src/components/       shared UI (RequestCard, Chip, Button, Text, ...)
src/lib/              Supabase client, auth, query hooks, audience rules
src/theme/            light/dark color tokens, spacing, fonts
src/types/database.ts generated from the schema (npm run db:types)
supabase/migrations/  every schema change, in order
supabase/tests/       pgTAP tests for the visibility rules
supabase/seed.sql     reference data (countries, areas of life)
prototype/            the original single-file web prototype, kept for reference
```

## Who can see a request

This rule is enforced in Postgres row-level security (`private.can_view_request`), not just in the UI. A signed-in user can read a request if at least one of these is true:

1. They wrote it.
2. It is shared with **All followers** and they are an **accepted** follower. Follows need the other person's approval.
3. It is shared with **Close friends** and they are on the author's close friends list.
4. It is shared with a **group** they belong to.
5. It is shared with the **World**.

Hidden (moderated) requests and anyone on either side of a block are excluded. Private responses are readable only by their sender and the request's author. Anonymous World posts never expose the author: `prayer_requests.author_id` cannot be selected by clients, and `request_cards.author_id` is null for anonymous posts.

## Getting started

Requirements: Node 20+, Docker (for the local Supabase stack).

```bash
npm install
cp .env.example .env.local     # then fill in the values printed by `supabase start`
npm run db:start               # local Supabase (Postgres, Auth, Storage, ...)
npm run db:reset               # apply migrations + seed
npm start                      # Expo dev server
```

Apple and Google sign-in use native modules, so they need a development build (`npx expo run:ios` / `run:android`, or `eas build --profile development`). Email sign-in works in any build. Locally, emailed codes appear in Mailpit at http://127.0.0.1:54324.

## Checks

```bash
npm run db:test     # pgTAP: visibility, responses, prayers, follows, close friends
npm test            # Jest unit tests
npm run typecheck
npm run lint
```

After any migration, regenerate types with `npm run db:types`.
