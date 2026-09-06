# Motodo.id Supabase Auth Setup

Phase B adds Auth + `profiles`. Listings, orders, chat, reviews, and notifications remain localStorage.

## How Auth works

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are **unset**, the app uses mock `motodo.users` / `motodo.session` (password still not verified).

If they **are set**, login/signup/logout/session use **Supabase Auth**. Passwords stay in Auth; they are never written to localStorage.

Session restore: `getSession()` plus `onAuthStateChange` in `AuthProvider`.

## profiles relationship

```
auth.users.id  =  profiles.id
```

A trigger `handle_new_user` inserts `profiles` on signup.

| Column | Meaning |
| --- | --- |
| `account_type` | `buyer` or `seller` (product intent) |
| `role` | `user` or `admin` (authorization) |

Signup metadata may set `full_name` and `account_type`. **`role` is always `user` in the trigger.** Client metadata cannot create an admin.

## Buyer / seller `account_type`

Chosen on the signup form. RLS allows a later change **only** `buyer` → `seller` (Become a Seller still updates mock `seller_profiles` in localStorage). Other `account_type` changes are rejected.

## User / admin `role`

Never use email to authorize. When Supabase is configured, `isAdmin` is `profiles.role = admin` (`AuthUser.privilege`).

Mock mode still treats `admin@motodo.id` as admin so the current QA account works **without** env vars.

## Create a development admin (safe)

1. Apply `supabase/migrations/20260906010000_create_profiles.sql` in the dashboard (SQL editor) or CLI. The Vite app does **not** run this.
2. Sign up normally as a user (`role` will be `user`).
3. In the SQL editor (postgres, not the anon key):

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<auth user uuid>';
```

Do not put an admin password or admin email in source code. Do not use `service_role` in the frontend.

## RLS (profiles)

- Authenticated users **SELECT** own row; admins **SELECT** all via `is_admin()`.
- Authenticated users **UPDATE** own row only (`id = auth.uid()`).
- No client **INSERT** / **DELETE**.
- Trigger blocks changing `role` while `auth.uid()` is set.
- Trigger allows `account_type` change only `buyer` → `seller` for authenticated clients.

## Seller profiles (Phase C)

When env is set, `/seller/register` inserts `public.seller_profiles` with `id = auth.uid()` and `seller_status = pending`. Owners cannot set approved. Admins use `approve_seller_profile` / `reject_seller_profile` (requires `profiles.role = 'admin'`). Apply `supabase/migrations/20260906020000_create_seller_profiles.sql` in the dashboard; the app does not run it.

## Migration fallback

`AuthProvider` branches on `isSupabaseConfigured()`. Mock keys `motodo.users` and `motodo.session` are not deleted.

Marketplace data (listings, orders, …) is still mock even when Auth is Supabase. Catalog cards still use seeded mock seller profiles when the listing seller is not in `seller_profiles`. Mock `motodo.sellerProfiles` is used when env is unset.

## Test login / signup (after SQL is applied and env is set)

1. Sign up buyer → row in Auth and `profiles` (`account_type=buyer`, `role=user`).
2. Log in, refresh, session remains.
3. Edit full name on `/profile`, refresh, name persists.
4. Log out → protected routes redirect to login.
5. Seller signup → `account_type=seller`, `role=user`.
6. Confirm a normal user cannot `UPDATE` `role` to `admin` (SQL as that user / table editor with anon).

If env vars are absent, skip this list; mock login still works.

## Security warnings

- Never ship `service_role` in Vite.
- Never authorize admin by email in Supabase mode.
- Never take profile id from the URL for writes; always `auth.uid()`.
- Confirm-email projects return no session on signup until the user confirms.
