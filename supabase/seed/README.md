# Motodo demo marketplace seed

DEMO DATA ONLY. Run these in the **Supabase SQL Editor** as the project owner. Do not run from the Vite app. Do not put `service_role` in frontend env.

## Apply

1. Run `supabase/migrations/20260906120000_add_is_demo.sql` (if not already applied)
2. Run `supabase/seed/demo_motodo_marketplace.sql`

The seed is idempotent. Running it twice must not duplicate sellers, listings, demo buyers, demo orders, or demo reviews (deterministic UUIDs + `ON CONFLICT`).

Demo Auth users use random unusable passwords and are not intended for login.

The seed updates **only** `is_demo = true` marketplace rows (and matching `@demo.motodo.id` auth users). It does not `UPDATE` or `DELETE` rows where `is_demo = false`.

Reviews require `orders.order_id` in the existing schema. The seed inserts **completed DEMO orders** as scaffolding so `listing_rating_summary` / `seller_rating_summary` can be calculated from real review rows. Those orders are inserted with `status = completed` directly so `complete_order()` does **not** decrement `listings.quantity`.

## After apply (optional checks)

```sql
SELECT COUNT(*) FROM public.listings WHERE is_demo;
-- expect 18

SELECT COUNT(*) FROM public.seller_profiles WHERE is_demo;
-- expect 5

SELECT COUNT(*) FROM public.reviews r
JOIN public.listings l ON l.id = r.listing_id
WHERE l.is_demo;
-- expect 56

SELECT listing_id, review_count, average_rating
FROM public.listing_rating_summary
WHERE listing_id IN (SELECT id FROM public.listings WHERE is_demo)
ORDER BY review_count DESC;

SELECT seller_id, review_count, average_rating
FROM public.seller_rating_summary
WHERE seller_id IN (SELECT id FROM public.seller_profiles WHERE is_demo);
```

## Remove

See the deletion block at the bottom of `demo_motodo_marketplace.sql`. Order (from this schema):

1. `reviews` for demo listings
2. `orders` for demo listings / demo buyers
3. `listing_images` for `listings.is_demo = true`
4. `listings` where `is_demo = true`
5. `seller_profiles` where `is_demo = true`
6. `profiles` where `is_demo = true`
7. matching `auth.identities` then `auth.users` (`%@demo.motodo.id`)
