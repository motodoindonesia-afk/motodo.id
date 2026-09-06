# Motodo demo marketplace seed

DEMO DATA ONLY. Run these in the **Supabase SQL Editor** as the project owner. Do not run from the Vite app. Do not put `service_role` in frontend env.

## Apply

1. Run `supabase/migrations/20260906120000_add_is_demo.sql`
2. Run `supabase/seed/demo_motodo_marketplace.sql`

The seed is idempotent. Running it twice must not duplicate sellers or listings.

Demo Auth users use random unusable passwords and are not intended for login.

## Remove

See the deletion block at the bottom of `demo_motodo_marketplace.sql`. Order (from this schema):

1. `listing_images` for `listings.is_demo = true`
2. `listings` where `is_demo = true`
3. `seller_profiles` where `is_demo = true`
4. `profiles` where `is_demo = true`
5. matching `auth.identities` then `auth.users`

That order respects FKs: `listing_images` → `listings` → `seller_profiles` → `profiles` → `auth.users`.
