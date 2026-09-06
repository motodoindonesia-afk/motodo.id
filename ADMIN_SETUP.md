# Motodo.id — Admin setup

Promote an existing **authenticated** user to admin with SQL in the Supabase dashboard (or CLI). There is **no** in-app admin promotion. Normal users cannot set `profiles.role`.

## Rule

Admin authorization is:

```text
public.profiles.role = 'admin'
```

and `public.profiles.id` = `auth.users.id` = `auth.uid()`.

Do **not** use:

- `admin@motodo.id` (mock mode only)
- `account_type`
- localStorage
- frontend flags

Signup always creates `role = 'user'`. Clients cannot change `role`.

## Prerequisites

1. Apply at least `supabase/migrations/20260906010000_create_profiles.sql` (and later Motodo migrations for a full marketplace).
2. The person has already signed up at https://motodo.id/signup (or staging) so a row exists in `auth.users` and `public.profiles`.

## Promote by email

Run in the SQL editor as a dashboard/postgres role (not the anon key):

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower('replace-with-real-email@example.com')
)
RETURNING id, role;
```

Expect one row with `role = admin`. If zero rows, the email is not registered.

## Promote by user id

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = '00000000-0000-0000-0000-000000000000'
RETURNING id, role;
```

## After promotion

1. The user must refresh or log out and log in so `AuthUser.privilege` reloads from `profiles`.
2. `/admin` uses `profiles.role` in the UI. RPCs still check `public.is_admin()`.
3. Do not put this user’s password, email, or user id in source code.

## Demote

```sql
UPDATE public.profiles
SET role = 'user'
WHERE id = '00000000-0000-0000-0000-000000000000'
RETURNING id, role;
```

## What not to do

- Do not add an “Make admin” button.
- Do not grant `service_role` to the Vite app.
- Do not `GRANT UPDATE (role)` to `authenticated` (the trigger already blocks client role changes).
