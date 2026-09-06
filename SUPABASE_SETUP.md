# Motodo.id Supabase Setup

Phase A plumbing plus Phase B Auth/profile client code. Marketplace data is still localStorage.

## 8. How to verify the client

## 1. Project prerequisites

- A Supabase project (create later; Phase A does not create one).
- Vite already exposes variables prefixed with `VITE_` to the browser via `import.meta.env`.
- Use only the **anon / publishable** key in this frontend.

## 2. Required environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL (`https://<project-ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Public anon (publishable) API key |

Copy `.env.example` to `.env.local` and fill these in when you have a project. The app starts without them.

## 3. Where to obtain the Supabase URL

In the Supabase dashboard: **Project Settings → Data API** (or **API**). Copy **Project URL**.

## 4. Where to obtain the anon / publishable client key

Same settings page. Copy the **anon** / **publishable** key (safe for the browser with RLS).

## 5. Keys that MUST NEVER be exposed

- **`service_role` secret** — bypasses RLS; server-only.
- Any personal access token, database password, or JWT secret.

Never put `SUPABASE_SERVICE_ROLE_KEY` (or the service_role value) in Vite `VITE_*` variables, source code, or git.

## 6. Local development setup

1. Copy `.env.example` to `.env.local`.
2. Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` when the project exists.
3. Restart `npm run dev` after changing env files.
4. Leave the values empty to keep using the mock app only.

`.env`, `.env.local`, and `.env.*.local` are gitignored.

## 7. Production environment setup

Set the same two `VITE_*` variables in the host’s build environment (CI or hosting dashboard). Rebuild the Vite app so they are inlined at build time. Do not inject the service_role key into the frontend build.

## 8. How to verify the client

- Code: `src/lib/supabase.ts` reads `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`.
- Auth: see `SUPABASE_AUTH_SETUP.md`. Apply `supabase/migrations/20260906010000_create_profiles.sql` before testing real login.
- `isSupabaseConfigured()` is `false` when either value is missing; `supabase` is `null`; the mock app still runs.
- `getSupabaseClient()` throws a clear error if something calls it before env is set.
- Do not log URL or keys.
- `npm run build` must pass with env unset.

A live Auth/Postgres check is optional and only valid after a real project exists and the profiles migration has been applied in the dashboard (never from app startup).

## 9. What is still mock

- Marketplace: listings, orders, inventory, chat, reviews, notifications, seller_profiles (localStorage)
- Auth when env vars are unset
- Storage buckets, payments, Realtime marketplace tables
