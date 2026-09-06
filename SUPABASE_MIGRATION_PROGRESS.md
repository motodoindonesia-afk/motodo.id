# Phase J/K follow-up — Production safety

- Production missing/invalid public Supabase env → configuration error page, never mock.
- Development without env → mock/localStorage unchanged.
- `/admin/users` hydrates `public.profiles` in Supabase mode.

# Phase J/K — Production preparation

## Implemented

- Production docs: `PRODUCTION_READINESS.md`, `SUPABASE_PRODUCTION_CHECKLIST.md`, `ADMIN_SETUP.md`
- `.env.example` placeholders only (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Auth client: persist session, auto refresh, detect session in URL
- User-facing Supabase error sanitizer (`src/lib/userFacingError.ts`) wired through repositories
- Mock/localStorage fallback **kept**. Payments still mock. No new tables.

## Next Phase

Not started from this request.

# Phase I — Final admin + security / RLS pass

## Implemented

- Static security audit of profiles, seller_profiles, listings, storage, orders, inventory, chat, reviews, notifications, views, Realtime, and frontend secrets.
- Hardening SQL (not executed by the app): `supabase/migrations/20260906080000_security_hardening.sql`
- Report: `SUPABASE_SECURITY_AUDIT.md`
- Frontend defense in depth: listing quantity updates filter `seller_id = auth user`.
- No new product features. Payments unchanged. Mock/localStorage fallback unchanged.

## Findings closed in SQL

- `listing_stock` no longer bypasses listings RLS (draft inventory).
- `listing_reserved_quantity` / `listing_available_quantity` hide private listing stock.
- Storage UPDATE/DELETE require `listings/<listing_id>/...`.
- `listing_images.storage_path` must match that convention.
- Trigger/internal functions revoked from `anon`/`authenticated`.
- Explicit deny INSERT/DELETE on `profiles`; DELETE deny on `seller_profiles`.

## Next Phase

Not started. Phase I is the last phase in this request.

# Phase H — Notifications

## Implemented

- Dual-mode notifications: PostgreSQL `notifications` when Supabase env is set; `motodo_notifications` localStorage otherwise.
- SQL (not executed by the app): `supabase/migrations/20260906070000_create_notifications.sql`
- `src/lib/notificationsSupabase.ts` — `getMyNotifications`, unread count from cache, mark-read RPCs, Realtime subscribe filtered to `auth.uid()`.
- `NotificationsProvider` hydrates on login and unsubscribes on logout/unmount.
- Frontend never `notifications.insert`. `createNotification()` is a no-op when Supabase is configured; mock localStorage creation remains for mock mode only.
- Existing bell, unread badge, `/notifications`, click-through, mark one / mark all, and Mark unread are unchanged.
- Mock localStorage notifications are **not** copied into Supabase.

## Database Migration SQL

`supabase/migrations/20260906070000_create_notifications.sql`

Table: `public.notifications`

`type` matches product events: `new_message`, `new_order`, `order_confirmed`, `order_completed`, `order_cancelled`, `listing_sold`, `listing_low_inventory`, `listing_status`, `review_reminder`, `seller_registration`, `seller_approved`, `seller_rejected`.

Mock previously used `seller_registration` for both admin “new seller” and seller approve/reject copy. Supabase maps:

- New seller application → `seller_registration` (admins)
- Approve → `seller_approved` (seller)
- Reject → `seller_rejected` (seller; body includes rejection reason)

`body` maps to client `Notification.message`. `link` is preferred for click-through (`entity_id` is uuid; order URLs use `order_number`).

Idempotency: partial unique index on `(user_id, type, entity_id)` for one-shot types only. `new_message` and `listing_status` may repeat.

## RLS

Enabled. `authenticated` may **SELECT** own rows (`user_id = auth.uid()`). INSERT / UPDATE / DELETE denied for clients. No admin policy to read other users’ notifications.

## RPCs / functions / triggers

### `create_notification(...)` — SECURITY DEFINER, **not** granted to `anon` / `authenticated`

Used only by other definer functions/triggers. Unique violation → no-op (no duplicate one-shot row).

### Client RPCs (authenticated)

- `mark_notification_read(p_notification_id uuid)` — owner only; sets `is_read` / `read_at`
- `mark_notification_unread(p_notification_id uuid)` — preserves existing Mark unread UI
- `mark_all_notifications_read()` — current user unread rows only

### Triggers (trusted creation)

- `orders` INSERT → seller `new_order`; low-inventory if available crosses ≤ 2 (same mock threshold)
- `orders` status: pending→confirmed / confirmed→completed / pending→cancelled → buyer (cancel notifies buyer only, matching mock)
- completed also creates `review_reminder` (no cron; same as mock complete-time reminder)
- `listings` status → `listing_sold` or `listing_status`
- `listings` quantity UPDATE → low-inventory transition
- `messages` INSERT → other participant `new_message` (not the sender)
- `seller_profiles` INSERT → admins `seller_registration`
- `seller_profiles` status → `seller_approved` / `seller_rejected`

Order RPCs remain authoritative. Notifications do not change order state.

## Realtime

`REPLICA IDENTITY FULL` on `notifications`. Migration tries `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications`.

If that fails in the SQL editor, Dashboard: **Database → Publications → supabase_realtime** → add `public.notifications`.

Client channel filter: `user_id=eq.${currentUserId}` (INSERT + UPDATE). Cache keyed by notification id (no duplicate rows).

## Data access layer

- `src/lib/notificationsSupabase.ts` — repository
- `src/lib/notifications.ts` — dual-mode
- `src/context/NotificationsContext.tsx` + `NotificationsDataGate` on `/notifications`

## Mock Fallback

When `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are unset: localStorage + existing `createNotification` paths. No Supabase calls.

## Known Limitations

- Payments remain mock; notification creation does not cover payments.
- Third-party logistics and discounts remain Coming Soon.
- localStorage notifications are not migrated.
- No scheduled review-reminder job (reminders still fire once on order complete).
- New published reviews do not notify the seller (mock never did).
- Cancel notifies the buyer only (mock behavior), not the seller.

## Next Phase

Not started. Phase H is the last phase in this request.

# Phase G — Reviews & Ratings

## Implemented

- Dual-mode reviews: PostgreSQL `reviews` when Supabase env is set; `motodo_reviews` localStorage otherwise.
- SQL (not executed by the app): `supabase/migrations/20260906060000_create_reviews.sql`
- `src/lib/reviewsSupabase.ts` — hydrate, `create_review`, admin `set_review_status`, rating summary views.
- `ReviewsProvider` hydrates a cache so existing sync getters keep working, including public listing/seller pages when logged out.
- Buyer submit on `/orders/:orderId` uses `create_review` only (no `reviews.insert`).
- One review per order (`UNIQUE(order_id)`). Duplicate submit is rejected.
- Verified Purchase is **not** a client field. Every stored review is created only for a completed order belonging to `auth.uid()`.
- Public listing/seller ratings use `listing_rating_summary` / `seller_rating_summary` (published reviews only).
- Admin hide/publish uses `set_review_status`. No buyer edit/delete UI was added (mock never had it).
- Mock localStorage reviews are unchanged when env is unset. Existing mock reviews are **not** copied into Supabase.

## Database Migration SQL

`supabase/migrations/20260906060000_create_reviews.sql`

Table: `public.reviews`

Server-only snapshots: `order_number` (maps to client `Order.id`), `listing_name`, `buyer_display_name`.

`status`: `published` | `hidden` for existing admin moderation.

Views: `public.listing_rating_summary`, `public.seller_rating_summary` (`security_invoker = true`, published rows only).

## RPCs

### `create_review(p_order_ref text, p_rating integer, p_title text, p_body text)`

Client supplies order ref (`MTD-…` or uuid), rating, title, body.

Server derives `buyer_id = auth.uid()`, `listing_id` / `seller_id` from the order.

Requires completed order owned by the buyer, rating 1–5, comment 5–1000 characters (current product rules). Title optional, ≤ 200.

Ignores any client seller/listing/buyer ids.

### `set_review_status(p_review_id uuid, p_status text)`

Admin only (`is_admin()`). `published` or `hidden`. Cannot change order/listing/seller/buyer/rating/body.

No `update_review` / buyer delete RPC — the product has no buyer edit/delete UI.

## RLS

- SELECT: `status = published` OR own `buyer_id` OR `is_admin()`
- INSERT / UPDATE / DELETE: denied for clients
- Anon may SELECT published reviews
- Seller dashboards only see published reviews (same as `getSellerReviews()`)

## Verified Purchase

Derived: review exists ⇒ it was inserted by `create_review` after `orders.status = completed` for that buyer. UI badge is unchanged. No `verified_purchase` column.

## Mock fallback

If Supabase env is unset, `src/lib/reviews.ts` still uses localStorage. Admin hide/publish remains local in mock mode.

## Testing

- `npm run build` — see session report
- Live tests 1–14 — **NOT TESTED** (SQL not applied; not requested this session)

## Known Limitations

- Notifications remain mock.
- Payments remain mock.
- Third-party logistics remains Coming Soon.
- Discounts remain Coming Soon.
- Review moderation is hide/publish only (existing admin UI). No full moderation workflow.
- Public buyer name is a snapshot of `profiles.full_name` (formatted like mock). No email/phone on reviews.

## Next Phase

Phase H — do not start automatically

---

# Phase F — Chat + Supabase Realtime


## Implemented

- Dual-mode chat: PostgreSQL `conversations` + `messages` when Supabase env is set; `motodo_conversations` / `motodo_chat_messages` localStorage otherwise.
- SQL (not executed by the app): `supabase/migrations/20260906050000_create_chat.sql`
- `src/lib/chatSupabase.ts` — inbox hydrate, RPCs, message fetch, Realtime subscriptions.
- `ChatProvider` hydrates the inbox and subscribes to conversation changes for the signed-in user.
- Existing routes `/messages`, `/messages/:conversationId`, `/seller/messages` are unchanged.
- Chat Seller still sends the initial interest message via `send_message` after `start_conversation` creates a new thread.
- Listing context uses live listing data when present, otherwise conversation snapshots. If a listing is deleted, `listing_id` becomes null and the thread remains.
- Mock localStorage chat is unchanged when env is unset. Existing mock threads are **not** copied into Supabase.

## Database Migration SQL

`supabase/migrations/20260906050000_create_chat.sql`

Tables: `public.conversations`, `public.messages`

View: `public.conversation_inbox` (last message, unread counts; `security_invoker = true` so RLS applies)

Unique: `(buyer_id, seller_id, listing_id)` so Chat Seller reuses an existing listing thread.

`listing_id` is `ON DELETE SET NULL` so deleting a listing does not delete the conversation.

Display snapshots on conversations (`listing_name`, `listing_image`, `buyer_name`) are set only by `start_conversation`.

## RPCs

All `SECURITY DEFINER` with `search_path = public`. Execute granted to `authenticated` only.

### `start_conversation(p_listing_id uuid)`

Client supplies only `listing_id`. Server sets `buyer_id = auth.uid()` and `seller_id = listings.seller_id`.

Requires authenticated user, listing `active` or `sold`, approved seller, buyer ≠ seller.

Returns JSON `{ created, conversation }`. Reuses the unique listing thread when it already exists.

### `send_message(p_conversation_id uuid, p_body text)`

`sender_id` is always `auth.uid()`. Trims body, requires 1–5000 characters, requires caller is buyer or seller on the thread. Updates `conversations.updated_at`.

### `mark_messages_read(p_conversation_id uuid)`

Caller must be buyer or seller. Sets `read_at` on messages **from the other participant**. Does not change `sender_id` or `body`.

## RLS

Conversations and messages:

- SELECT: buyer own, seller own, admin all
- INSERT / UPDATE / DELETE: denied for `authenticated` (RPC owner bypasses RLS)
- Anon: no access

Unread is derived: `read_at IS NULL` and `sender_id !=` the viewer (inbox view splits buyer vs seller).

## Realtime

Migration sets `REPLICA IDENTITY FULL` on both tables (needed for Realtime + RLS).

It attempts:

`ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;`
`ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;`

If the publication is missing, add those two tables in the Supabase dashboard: **Database → Publications → supabase_realtime**.

Client:

- Open thread: subscribe to `messages` for `conversation_id=eq.<id>` only (INSERT + UPDATE). Unsubscribe on leave.
- Inbox / unread: subscribe to `conversations` filtered by `buyer_id` or `seller_id` (two channels). Refetch inbox on change. Not a global messages subscription.

## Ownership model

- Buyer inbox: `buyer_id = auth.uid()`
- Seller inbox: `seller_id = auth.uid()` (same as `seller_profiles.id`)
- Seller_id is never taken from the browser
- Sender_id is never taken from the browser

## Mock fallback

If Supabase env is unset, `src/lib/chat.ts` still uses localStorage and in-memory events. Notifications on new messages remain mock-only.

## Testing

- `npm run build` — see session report
- Live tests A–S — **NOT TESTED** until this SQL (and Realtime publication) is applied
- Mock mode with env removed — **NOT RE-RUN** this phase (mock paths kept)

## Known Limitations

- Reviews migrated in Phase G. Notifications remain mock (no chat-triggered Supabase notifications).
- Payments remain mock.
- Third-party logistics remains Coming Soon.
- Discounts remain Coming Soon.
- Existing localStorage conversations are not migrated.

## Next Phase

Phase G — see above

---

# Phase E — Orders + Server-Side Inventory / Reservation


## Implemented

- Dual-mode orders: PostgreSQL `orders` + RPCs when Supabase env is set; `motodo_orders` localStorage otherwise.
- SQL (not executed by the app): `supabase/migrations/20260906040000_create_orders.sql`
- `src/lib/ordersSupabase.ts` — `create_order` / `confirm_order` / `complete_order` / `cancel_order` RPCs only. No client `orders.insert` / status updates.
- `OrdersProvider` hydrates a cache so existing sync `getOrders()` / `getOrderById()` pages keep working.
- Checkout `/checkout/:listingId` submits via `create_order`. Quantity cap uses `listing_stock` available units.
- Buyer `/orders`, seller `/seller/orders`, admin `/admin/orders` read through RLS (own / own seller / all).
- Seller confirm / complete / cancel call RPCs. Buyer financial fields are never accepted from the client.
- Public availability uses `listing_stock` (total − pending − confirmed). Completed orders deduct `listings.quantity` once in `complete_order`.
- Mock localStorage order code is unchanged when env is unset. Existing mock orders are **not** copied into Supabase.

## Database Migration SQL

`supabase/migrations/20260906040000_create_orders.sql`

Apply in the Supabase SQL editor or CLI. The Vite app does **not** run this.

Table: `public.orders`

View: `public.listing_stock` (`total_quantity`, `reserved_quantity`, `available_quantity`)

Functions: `listing_reserved_quantity(uuid)`, `listing_available_quantity(uuid)`

## RPCs

All `SECURITY DEFINER` with `search_path = public`. Execute granted to `authenticated` only.

### `create_order`

Client may send: `listing_id`, `quantity`, `delivery_method`, `delivery_address`, `delivery_city`, `payment_method`, plus optional buyer phone and delivery notes.

Server derives: `buyer_id` (`auth.uid()`), `seller_id` and `unit_price` from the listing, `order_number` (`MTD-XXXXXXXX`, collision-retried), subtotal, `discount_amount = 0`, `buyer_total`, `seller_fee_rate = 0.02`, `seller_fee_amount`, `seller_net_amount`.

Locks the listing `FOR UPDATE`. Rejects inactive listings, qty &lt; 1, insufficient **available** stock, unapproved seller, buyer = seller, `third_party` delivery.

Does **not** decrement `listings.quantity`. Inserts `status = pending`.

### `confirm_order`

Seller of the order (or admin): `pending` → `confirmed`. Buyer confirm is denied. No inventory deduction.

### `complete_order`

Seller of the order (or admin): `confirmed` → `completed` only. Locks listing, requires `listings.quantity >= order.quantity`, subtracts quantity, sets listing `sold` when quantity becomes 0. Cannot go negative.

### `cancel_order`

Buyer (own pending), seller (own pending), or admin: `pending` → `cancelled`. Does not change `listings.quantity`. Reservation disappears from `listing_stock`.

## Reservation / inventory model

- `listings.quantity` = **total** stock.
- Reserved = SUM(quantity of `pending` + `confirmed` orders).
- Available = total − reserved (never negative).
- Cancel releases reservation automatically.
- Complete consumes total stock exactly once.

## Financial calculations

- `subtotal = ROUND(unit_price * quantity, 2)`
- `discount_amount = 0` (Coming Soon)
- `buyer_total = subtotal − discount` (seller fee is **not** added)
- `seller_fee_rate = 0.02` (exactly 2%)
- `seller_fee_amount = ROUND(buyer_total * 0.02, 2)`
- `seller_net_amount = buyer_total − seller_fee_amount`

Buyer order UI does not show seller fee/net. Seller and admin views still do.

## RLS

- SELECT: `buyer_id = auth.uid()` OR `seller_id = auth.uid()` OR `is_admin()`
- INSERT / UPDATE / DELETE: denied for `authenticated` (RPC owner bypasses RLS)
- Anon: no table access
- `listing_stock` SELECT: anon + authenticated (availability only)

## Mark active

`protect_listing_columns` now also rejects `status = active` when `quantity <= 0`. Client mark-active in Supabase mode checks total quantity &gt; 0 and approved seller.

## Checkout / order integration

- Checkout loads listing + available stock from cache (hydrated from Supabase + `listing_stock`).
- Place order → `create_order` → redirect `/orders/:orderNumber` (`Order.id` = `order_number`).
- Status actions → RPCs only.
- Delivery UI unchanged (third-party Coming Soon / disabled). Payment remains mock. Discount remains Coming Soon.

## Mock fallback

If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are unset, `placeOrder` and inventory still use localStorage. Client inventory helpers do **not** read `motodo_orders` when Supabase is configured.

## Testing

- `npm run build` — see session report
- Live inventory/order tests 1–16 — **NOT TESTED** until this SQL is applied
- Concurrent last-unit (test E) — **NOT TESTED** (requires applied SQL)
- Mock mode with env removed — **NOT RE-RUN** this phase (mock paths kept)

## Known Limitations

- Payments remain mock (`payment_status` stays `pending`; no payment provider).
- Chat migrated in Phase F. Reviews and notifications remain mock/localStorage.
- Third-party logistics remains Coming Soon (RPC rejects `third_party`).
- Discounts remain Coming Soon (`discount_amount` is always 0 in `create_order`).
- Existing localStorage orders are not migrated.

## Next Phase

Phase F — see above

---

# Phase D — Listings + Listing Images


## Implemented

- Dual-mode listings: Supabase `listings` + `listing_images` + Storage when env is set; `motodo.listings` localStorage otherwise.
- SQL (not executed by the app): `supabase/migrations/20260906030000_create_listings.sql`
- `src/lib/listingsSupabase.ts` — centralized CRUD, image upload/delete/reorder.
- `ListingsProvider` hydrates a cache so existing sync `getListings()` / browse / seller pages keep working.
- Create/edit/publish/delete/mark sold/active go through the existing listing UI.
- Public browse/detail/featured use active Supabase listings (catalog seed is not copied into Supabase).
- Seller `seller_id` is always `auth.uid()`; pending/rejected sellers cannot insert or set `status=active` (trigger + RLS).

## Database Migration SQL

`supabase/migrations/20260906030000_create_listings.sql`

Tables: `public.listings`, `public.listing_images`. View: `public.seller_listing_cards` (approved display fields only).

## Storage bucket

Preferred name: `listing-images` (public read).

Path convention: `listings/<listing_id>/<uuid>.jpg`

The migration inserts the bucket and Storage policies. If `INSERT INTO storage.buckets` is denied in the SQL editor:

1. Storage → New bucket → id/name `listing-images` → Public bucket ON.
2. Run the `storage.objects` policies from the same migration file.

## RLS

Listings:

- SELECT: `active`/`sold` for everyone; own rows (including draft) for the seller; all rows for `is_admin()`
- INSERT: own `seller_id`, approved seller only
- UPDATE/DELETE: own or admin
- Trigger: `seller_id` forced to `auth.uid()`; `status=active` requires approved seller

Images:

- SELECT when the parent listing is visible
- INSERT/UPDATE/DELETE: `owns_listing(listing_id)` or admin
- Storage: public SELECT on the bucket; write/delete only for owner path `listings/<listing_id>/...` or admin

## Listing CRUD

`createListing` / `updateListing` / `deleteListing` / `markListingAsSold` / `markListingAsActive` in `src/lib/listings.ts` branch on `isSupabaseConfigured()`.

## Image upload

Form still uses in-browser photo picking. In Supabase mode those images are uploaded to Storage and rows are written to `listing_images`. Deletes look up the row by listing id (not a raw client path).

## Testing

- `npm run build` — **PASS**
- REST probe `listings` — **MISSING** (migration not applied)
- Live tests A–Q — **NOT TESTED**
- Mock mode with env removed — **NOT RE-RUN** (`.env.local` present; mock paths kept)

## Known Limitations

- Orders migrated in Phase E (RPC + reservation). Chat migrated in Phase F. Reviews, notifications, payments remain mock/localStorage.
- Catalog `src/data/listings.ts` is not imported into Supabase. In Supabase mode, browse/featured show only database listings (empty until sellers publish).
- Homepage featured uses the first five public active Supabase listings instead of the old catalog ids.

## Next Phase

Phase E — orders (do not start automatically)

---

# Phase C — Seller Profiles


## Implemented

- Dual-mode seller profiles: Supabase `seller_profiles` when env is set; `motodo.sellerProfiles` localStorage otherwise.
- SQL migration file (not executed by the app): `supabase/migrations/20260906020000_create_seller_profiles.sql`
- `src/lib/sellerProfiles.ts` — get/create/update/list/approve/reject helpers using the anon client only.
- `SellerProfilesProvider` hydrates a client cache so existing sync `getSellerProfile()` call sites keep working.
- `/seller/register`, seller dashboard/profile, and `/admin/sellers` use the cache in Supabase mode.
- Approve/reject go through SECURITY DEFINER RPCs that check `public.is_admin()` (`profiles.role = 'admin'`).
- Mock seller notifications unchanged in mock mode. No notifications table in Supabase.

## Database Migration SQL

`supabase/migrations/20260906020000_create_seller_profiles.sql`

Apply in the Supabase SQL editor or CLI. The Vite app does **not** run this.

`seller_profiles.id` = `profiles.id` = `auth.users.id`.

## Authentication Flow

Unchanged from Phase B.

## Profile Flow

Unchanged. Seller registration still may set `profiles.account_type` buyer→seller (existing RLS).

## Seller profile flow

```
Authenticated user → INSERT seller_profiles (id = auth.uid(), seller_status = pending)
Admin → RPC approve_seller_profile / reject_seller_profile
Rejected owner → UPDATE business fields + seller_status pending (resubmit only)
```

Duplicate rows are blocked by the primary key.

## RLS

- SELECT own row, or all rows if `is_admin()`
- INSERT own row only, `seller_status = pending`, `rejection_reason` null
- UPDATE own row only for owners
- Trigger blocks owner changes to `seller_status` except rejected→pending
- Trigger blocks owner changes to `rejection_reason`
- Admin status changes only via RPCs (`is_admin()`)
- No client DELETE

## Admin Authorization

Supabase: `profiles.role = 'admin'` via `is_admin()`. Not email.

Mock: existing `admin@motodo.id` email check only when env is unset.

## Mock Fallback

If Supabase is **not** configured, seller registration, dashboard, and admin verification still use localStorage.

## Security Review

- No `service_role` in the frontend
- Owner cannot self-approve (`seller_status` trigger + RPC `is_admin()`)
- Writes use `auth.uid()`, not URL ids
- Admin email is not used when Supabase is configured

## Testing

- `npm run build` — **PASS**
- REST probe `seller_profiles` — **MISSING** (migration not applied)
- Live tests A–H (register, refresh, admin approve/reject, duplicate, RLS deny) — **NOT TESTED** (table does not exist yet)
- Mock mode with env removed — **NOT RE-RUN** this phase (`.env.local` is present). Mock code paths were kept.

## Known Limitations

- Extra mock-only seller fields are not columns yet (see Phase C).
- Orders, chat, reviews, notifications remain localStorage.

## Next Phase

Phase D — listings (see above)

---

# Phase B — Authentication + Profiles

## Implemented

- Dual-mode `AuthProvider`: mock localStorage if Supabase env is unset; Supabase Auth + `profiles` if configured.
- `src/lib/supabaseAuth.ts` for signup, login, logout, session, profile fetch/update.
- Profile page reads `profiles` fields when in Supabase mode; full name updates go to `profiles`.
- Protected/admin routes wait for session hydrate.
- Admin check in Supabase mode is `profiles.role`, not email.
- SQL migration file for `profiles`, trigger, and RLS (not executed by the app).

## Database Migration SQL

`supabase/migrations/20260906010000_create_profiles.sql`

Not applied automatically. Apply in Supabase SQL editor or CLI when a project exists.

## Authentication Flow

```
Signup → supabase.auth.signUp (metadata: full_name, account_type)
      → trigger inserts profiles (role = user always)
Login  → signInWithPassword → load profiles
Logout → signOut
Session → getSession + onAuthStateChange
```

Passwords are not stored in localStorage.

## Profile Flow

- Id = `auth.users.id`
- Client updates: `full_name`; optional `account_type` buyer→seller only
- `role` is not client-writable

## RLS

See `SUPABASE_AUTH_SETUP.md`. Own SELECT/UPDATE; no client INSERT/DELETE; `role` locked for `auth.uid()`; admin SELECT via `is_admin()`.

## Admin Authorization

- Supabase configured: `AuthUser.privilege === 'admin'` from `profiles.role`
- Mock: still `admin@motodo.id` for existing QA
- Promote admin with dashboard SQL only (documented)

## Mock Fallback

`motodo.users` / `motodo.session` kept. Listings, orders, inventory, chat, reviews, notifications unchanged (localStorage).

## Security Review

- No service_role in the frontend
- No password persistence in localStorage for Supabase mode
- Signup cannot set `role=admin`
- Profile writes use `auth.uid()`, not URL ids
- Tokens stay in the Supabase client session (not logged)

## Testing

- `npm run build` — **PASS** (`tsc -b && vite build`, 2026-09-06)
- Live Auth was later configured via `.env.local` (Phase B follow-up)
- Seller profiles table was not part of Phase B

## Known Limitations

- Email confirmation: signup may not return a session until confirmed
- Admin users list / mock seller notify still use localStorage identities
- `phone` on checkout is not a `profiles` column yet
- Catalog listings still keyed to mock seller ids

## Next Phase

Phase C — `seller_profiles` + approval (this document, above)
