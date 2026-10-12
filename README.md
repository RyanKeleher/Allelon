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

Hidden (moderated) requests and anyone on either side of a block are excluded. Group membership changes only through database functions: anyone with an invite code can *ask* to join, a group admin approves each request, and a removed member loses access immediately. These rules are tested in `supabase/tests/groups.test.sql`. Private responses are readable only by their sender and the request's author. Anonymous World posts never expose the author: `prayer_requests.author_id` cannot be selected by clients, and `request_cards.author_id` is null for anonymous posts.

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

## Try it on your phone

You need a computer with Node 20+ and a phone with the free **Expo Go** app (App Store / Google Play).

1. **Create a backend.** Make a free project at [supabase.com](https://supabase.com). In the project, open **Project Settings → API** and copy the Project URL and the `anon` public key.
2. **Load the schema.** On your computer:
   ```bash
   git clone https://github.com/RyanKeleher/Allelon.git && cd Allelon
   git checkout claude/beautiful-babbage-uwma03
   npm install
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push --include-seed
   ```
3. **Send sign-in codes.** In Supabase, go to **Authentication → Emails → Magic Link**, and put `{{ .Token }}` in the template body, so emails contain a sign-in code (6–10 digits, set under Authentication → Sign In / Providers → Email).
4. **Point the app at it.** Create `.env.local`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```
5. **Run it.** `npx expo start`, then scan the QR code (iPhone: Camera app; Android: Expo Go). Your phone and computer must be on the same Wi-Fi, or use `npx expo start --tunnel`.

Sign in with your email code. Apple and Google sign-in need a development build, not Expo Go.

Want sample people and requests? Paste `supabase/demo.sql` into the Supabase SQL editor. It creates Grace, James, Yuki, Rachel, and Daniel. They follow each other. After you sign in, search for `@gracemiller` and follow her. Follows need approval, so accept your request on her behalf in the SQL editor:
```sql
update follows set status = 'accepted'
where followee_id = 'd0000000-0000-0000-0000-000000000001' and status = 'pending';
```

### Quick preview in a browser

`npx expo start --web` runs the same screens in a browser. `scripts/screenshots.mjs` captures phone-sized screenshots of every Phase 1 screen against a local stack loaded with `supabase/demo.sql`.

## AI features (translation and "Help me write")

Both run in Supabase Edge Functions (`supabase/functions/translate`, `supabase/functions/suggest-response`), so the Anthropic API key never ships in the app. They only work on requests the person can already see (the database's visibility rules apply), translations are cached per request and language, and each person has a daily limit (100 translations, 30 suggestions).

To turn them on for your Supabase project:

```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase functions deploy translate suggest-response
```

They use `claude-opus-5-5` at low effort by default. To use a different model, set `ALLELON_AI_MODEL` the same way (for example `npx supabase secrets set ALLELON_AI_MODEL=claude-haiku-5-5` for lower cost).

## Notifications, check-ins, and safety

**In-app notifications** work with no extra setup: responses, follow requests, group join requests, answered prayers, and gentle check-ins (a reminder a few days after you pray for someone; people can turn these off in Settings).

**Push notifications** (to the phone's lock screen) need three one-time steps. Pushes never include anyone's prayer text, only who did what.

1. Create an EAS project: `npx eas-cli@latest init`, then add the printed id to `.env.local` as `EAS_PROJECT_ID=...`. Push needs a development or TestFlight build (`npx eas-cli@latest build --profile development`), not Expo Go.
2. Deploy the functions: `npx supabase functions deploy send-push delete-account`.
3. In the Supabase SQL editor, let the database call `send-push` every minute:
   ```sql
   select vault.create_secret('https://<your-project-ref>.supabase.co', 'project_url');
   select vault.create_secret('<your service_role key>', 'service_role_key');
   ```
   The service role key is under Project Settings → API. It stays inside the database's encrypted Vault.

**Moderation.** Every request, response, and profile has Report and Block. To make someone a moderator (they get a Reports screen in Settings), run in the SQL editor:
```sql
update profiles set is_moderator = true where handle = 'their_handle';
```

**Crisis resources.** If a request or response mentions suicide or self-harm, the author and readers see a gentle card with crisis lines for their country (988 in the US and Canada, Samaritans in the UK and Ireland, Lifeline in Australia, and findahelpline.com everywhere). Nothing is posted or sent on anyone's behalf.

**Deleting an account** (Settings → Delete my account) removes the person's photos and every row they own. Groups they ran pass to the next member.

## Grow content

Grow is curated, not AI-generated, and every item cites its source. It lives in `supabase/migrations/20261012000002_grow_content.sql`: scripture on prayer quoted exactly from the World English Bible (public domain), the ACTS prayer pattern, and links to BibleProject, 24-7 Prayer, Pray as you go, and Desiring God. Edit that file to change it.

## Checks

```bash
npm run db:test     # pgTAP: visibility, responses, prayers, follows, close friends
npm test            # Jest unit tests
npm run typecheck
npm run lint
```

After any migration, regenerate types with `npm run db:types`.
