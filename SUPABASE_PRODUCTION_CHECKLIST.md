# Motodo.id — Supabase production checklist

Manual dashboard and host steps. The Vite app does **not** apply SQL or change the Supabase project.

## Environment (host / CI)

- [ ] `VITE_SUPABASE_URL` = project URL (`https://<ref>.supabase.co`)
- [ ] `VITE_SUPABASE_ANON_KEY` = anon / publishable key only
- [ ] No `service_role` / `SUPABASE_SERVICE_ROLE_KEY` in the frontend build
- [ ] `.env.local` is not committed (gitignored)
- [ ] Production **must** have both `VITE_*` vars with real values (not `.env.example` placeholders). A production build without them shows a configuration error and **does not** use mock/localStorage.
- [ ] Development may omit them to use mock/localStorage.

## SQL migrations (apply in order, not from the app)

- [ ] `20260906010000_create_profiles.sql`
- [ ] `20260906020000_create_seller_profiles.sql`
- [ ] `20260906030000_create_listings.sql` (includes `listing-images` bucket insert + storage policies)
- [ ] `20260906040000_create_orders.sql`
- [ ] `20260906050000_create_chat.sql`
- [ ] `20260906060000_create_reviews.sql`
- [ ] `20260906070000_create_notifications.sql`
- [ ] `20260906080000_security_hardening.sql`

## Auth (Dashboard → Authentication)

Site URL:

- [ ] `https://motodo.id`

Redirect URLs (allow list):

- [ ] `https://motodo.id`
- [ ] `https://motodo.id/login`
- [ ] `https://motodo.id/profile`
- [ ] Staging URLs if used (e.g. `http://localhost:5173/**` for local only)

Also confirm:

- [ ] Email confirmation / templates match the product (confirmation email is expected after signup)
- [ ] JWT expiry / refresh is left at Supabase defaults unless you have a reason to change it
- [ ] No custom “admin email” Auth hook

The app persists session in the browser (`persistSession`, `autoRefreshToken`, `detectSessionInUrl`).

## Admin

- [ ] At least one real user exists
- [ ] Promote that user with `ADMIN_SETUP.md` (SQL `profiles.role = 'admin'`)
- [ ] Log in and open `/admin` as that user
- [ ] Confirm `/admin/users` lists `profiles` (name, account type, authorization). No in-app role promotion.
- [ ] Confirm a normal user hitting `/admin` is redirected (UI) and cannot call admin RPCs

## Storage (Dashboard → Storage)

Bucket:

- [ ] Name: `listing-images`
- [ ] Public: **yes** (marketplace listing photos are meant to be public)

Path convention:

```text
listings/<listing_id>/<uuid>.jpg
```

Policies (from migrations + hardening):

- [ ] Public SELECT on `listing-images`
- [ ] Authenticated INSERT/UPDATE/DELETE only for `listings/<owned listing uuid>/...` or admin
- [ ] If the migration `INSERT INTO storage.buckets` was denied, create the public bucket by hand, then re-run the storage policy statements from `20260906030000` and `20260906080000`

## Realtime (Dashboard → Database → Publications)

Add to `supabase_realtime` if the migration `ALTER PUBLICATION` did not apply:

- [ ] `public.conversations`
- [ ] `public.messages`
- [ ] `public.notifications`

Replica identity FULL is set in SQL for those tables.

## RLS smoke (after SQL)

- [ ] Anon cannot SELECT draft listings
- [ ] Anon `listing_stock` has no draft rows
- [ ] Seller cannot `UPDATE seller_profiles.seller_status = 'approved'`
- [ ] Buyer cannot `INSERT` into `orders` / `messages` / `reviews` / `notifications`
- [ ] `create_order` / `create_review` / `send_message` work as the correct actor

## Hosting

- [ ] `npm run build` in CI with the two `VITE_*` vars
- [ ] SPA fallback: all routes serve `index.html` (React Router)
- [ ] HTTPS on `motodo.id`
- [ ] Do not deploy `dist/` with a service_role key inlined

## Do not ship to paying customers until

- [ ] Payments are a real gateway (currently mock / pending)
- [ ] Third-party logistics (Coming Soon) is either hidden or integrated
