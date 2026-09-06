# Motodo.id — Supabase security audit (Phase I)

Static review of migrations A–H plus `20260906080000_security_hardening.sql`. **Not live-tested.** Do not treat this as a penetration-test report.

Authorization source of truth: `auth.uid()`. Admin: `public.profiles.role = 'admin'` via `public.is_admin()`. Seller identity: `seller_profiles.id` = `profiles.id` = `auth.uid()`.

---

## 1. Authentication model — PASS

- Browser client uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` only (`src/lib/supabase.ts`).
- Signup trigger `handle_new_user` always inserts `role = 'user'`. Client metadata may set `account_type` (`buyer`/`seller`) and `full_name` only.
- Session identity is GoTrue `auth.uid()`, not localStorage, when env is configured.

**Mock-only:** `admin@motodo.id` / `MOCK_ADMIN_USER_ID` apply when Supabase env is unset. `isAdmin()` in Supabase mode uses `AuthUser.privilege` from `profiles.role`.

## 2. Admin authorization — PASS (UX gate is not the boundary)

- RPCs `approve_seller_profile`, `reject_seller_profile`, `set_review_status`, and order admin paths call `public.is_admin()`.
- `is_admin()` is SECURITY DEFINER, `search_path = public`, keyed on `profiles.id = auth.uid() AND role = 'admin'`.
- Frontend `/admin/*` uses `AdminRoute` → `privilege === 'admin'`. Editing localStorage or `account_type` cannot satisfy the RPCs.
- Promoting an admin remains dashboard SQL (authenticated clients cannot set `profiles.role`).

**Remaining product gap (not privilege escalation):** `/admin/users` still lists `motodo.users` localStorage identities. That directory is incomplete in Supabase mode; it does not grant database admin.

## 3. Seller authorization — PASS

- SELECT own or admin. INSERT own with `seller_status = pending`.
- Trigger `protect_seller_profile_columns` forces `id = auth.uid()`, pending status, null rejection on insert; owners cannot self-approve; rejected → pending resubmit is allowed and clears reason.
- Approve/reject only via SECURITY DEFINER RPCs that check `is_admin()`.
- No client DELETE grant; explicit DELETE deny added in Phase I.

## 4. Listings RLS — PASS

- Public SELECT: `active`/`sold`, or owner, or admin. Drafts are not public.
- INSERT requires approved seller; trigger sets `seller_id = auth.uid()`.
- UPDATE/DELETE: owner or admin. `seller_id`/`id` cannot be changed.
- Active status requires `seller_profiles.seller_status = approved` (trigger + INSERT WITH CHECK).
- `quantity >= 0` CHECK. Active + `quantity <= 0` blocked in `protect_listing_columns` (Phase E).
- Pending/rejected sellers cannot create listings.

## 5. Storage security — FIXED

**Before:** INSERT required `listings/` prefix; UPDATE/DELETE did not. Invalid uuid segments could error instead of deny. `listing_images.storage_path` was not constrained to the listing id.

**After (`20260906080000`):** `listing_id_from_storage_name` requires `listings/<uuid>/...`. INSERT/UPDATE/DELETE use that helper + `owns_listing` or admin. Table trigger requires `listings/<listing_id>/<filename>`. Public read of bucket `listing-images` remains (catalog images).

## 6. Orders / RPC security — PASS

- Client INSERT/UPDATE/DELETE denied. SELECT buyer, seller, or admin.
- `create_order` derives buyer, seller, prices, 2% fee, net, order number. Client cannot set those fields.
- `confirm_order` / `complete_order`: seller or admin; pending→confirmed→completed.
- `cancel_order`: pending only; buyer, seller, or admin (matches product).
- `order_row_by_ref` / `generate_order_number` not granted to clients.

## 7. Inventory security — FIXED (view + helpers) / PASS (order machine)

- Reservations: pending + confirmed. `create_order` `FOR UPDATE` on listing then re-reads reserved qty.
- Complete deducts `listings.quantity` once from `confirmed`. Cancel does not deduct (reservation released by status).
- **FIXED:** `listing_stock` was `security_invoker = false`, so anon could read draft totals/reserved. Now invoker=true (listings RLS applies).
- **FIXED:** `listing_reserved_quantity` / `listing_available_quantity` now return 0 unless the listing is public (`active`/`sold`), owned, or caller is admin.

**REQUIRES LIVE TEST:** concurrent checkout under load.

## 8. Chat security — PASS

- Participant-or-admin SELECT. INSERT/UPDATE/DELETE denied.
- `start_conversation`: buyer = `auth.uid()`, seller from listing; unique listing thread.
- `send_message`: `sender_id = auth.uid()`; participant only.
- `mark_messages_read`: participant; marks others’ messages only.
- `conversation_inbox` is `security_invoker = true` so it cannot list other users’ threads.
- Phase I revokes client EXECUTE on `is_conversation_participant` (unused by the app; RLS inlines the check).

**REQUIRES LIVE TEST:** Realtime RLS on `messages` / `conversations`.

## 9. Reviews security — PASS

- Mutations via `create_review` / `set_review_status` only.
- Buyer + completed order + one per order; listing/seller from order; rating 1–5.
- Public SELECT: `status = published` or own or admin. Summaries filter published.
- No verified-purchase client flag.

## 10. Notifications security — PASS

- SELECT own. INSERT/UPDATE/DELETE denied.
- Mark read/unread/all-read: `auth.uid()` owner only; cannot change title/body/type/user_id.
- `create_notification` is SECURITY DEFINER and **not** granted to `anon`/`authenticated`.
- Triggers on orders, listings, messages, seller_profiles. No trigger on `notifications` (no recursion).
- Client subscribe filter `user_id=eq.<self>`; RLS still applies.

**REQUIRES LIVE TEST:** Realtime payloads for other users’ rows are dropped.

## 11. View security

| View | Invoker | Verdict |
|---|---|---|
| `listing_stock` | **true** after Phase I | **FIXED.** Inventory for rows the caller can SELECT. Public catalog stock is intended. |
| `seller_listing_cards` | false (definer) | **PASS.** Approved sellers only: `id`, `business_name`, `city`, `created_at`. No phone, NIB, rejection, or email. Needed so anonymous catalog pages can show garage name. |
| `listing_rating_summary` | true | **PASS.** Published aggregates only. |
| `seller_rating_summary` | true | **PASS.** Published aggregates only. |
| `conversation_inbox` | true | **PASS.** Must stay invoker; otherwise it would leak all threads. |

## 12. Realtime security — PASS (code) / REQUIRES LIVE TEST (runtime)

- Published: `conversations`, `messages`, `notifications`. `REPLICA IDENTITY FULL`.
- App channels filter by conversation id, buyer/seller id, or notification `user_id`.
- Unfiltered subscribe should still be constrained by SELECT RLS (verify in a live project).

## 13. Frontend secret audit — PASS

Searched `src/` for `service_role`, `SUPABASE_SERVICE_ROLE`, secret keys: **none**.

Direct table writes:

- `profiles.update` — allowed fields only; role blocked by trigger.
- `seller_profiles` insert/update — own row; status protected by trigger; approve/reject via RPC.
- `listings` / `listing_images` — RLS + triggers; storage path owned listing.
- Orders, messages, reviews, notifications: **select + RPC only**. No `.insert` on those tables.

`createNotification()` is a no-op when Supabase is configured.

Phase I: `updateListingQuantityRemote` now scopes `.eq('seller_id', session user)` (defense in depth; RLS already required it).

## 14. Fixes made (Phase I)

Migration: `supabase/migrations/20260906080000_security_hardening.sql` (**not executed**).

- `listing_stock` security invoker
- Stock RPCs gated on listing visibility
- Storage path helper + tighter storage policies
- `listing_images` path trigger
- Explicit INSERT/DELETE deny on `profiles`; DELETE deny on `seller_profiles`
- Revoke EXECUTE on trigger/internal functions from `anon`/`authenticated`

Frontend: `src/lib/listingsSupabase.ts` quantity update ownership filter.

## 15. Remaining known risks

- Payments remain mock; `payment_status` is not a paid gateway.
- No live RLS/Realtime/concurrency test in this phase.
- `/admin/users` is not a Supabase user directory.
- Public listing images (by design).
- `seller_listing_cards` is a definer view of **public** seller card fields only.
- UUID guessing of conversation ids: boolean/RLS deny only; no message body without participation.
- Anon `GRANT EXECUTE` on `is_admin()` remains required for listings RLS expressions (always false for anon).
- Email confirmation / promoting admins still operational procedures, not app features.

---

Status legend used above: **PASS** = static review matches the model; **FIXED** = gap closed in the new migration or repository; **REQUIRES LIVE TEST** = cannot be proven without a running project.
