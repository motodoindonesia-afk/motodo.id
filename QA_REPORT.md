# Motodo.id QA Report

**Branch:** `cursor-homepage-v1`  
**App:** Vite + React + TypeScript mock marketplace (localStorage)  
**Environment:** `http://127.0.0.1:5173`  
**Date:** 5–6 September 2026  
**Constraints honored:** no Supabase, no new product features, no UI redesign, no commit/push. SPA one-frame snapshot not fixed (Round 1 LOW).

---

## ROUND 1

Retest of previously failed mock-marketplace issues after FAIL fixes. Verified in browser.

### Executive summary (Round 1)

All previously failed items from the Motodo.id mock-marketplace QA pass were fixed on `cursor-homepage-v1` and retested. `npm run build` (`tsc -b && vite build`) **PASS**.

No remaining HIGH or MEDIUM product bugs from the original FAIL list. Residual SPA route-commit lag (one frame of previous page) is LOW.

### Build (Round 1)

| Check | Status |
| --- | --- |
| `npm run build` (`tsc -b && vite build`) | **PASS** |
| TypeScript compile errors | **PASS** |
| Vite chunk size warning | **PASS** (warning only) |

### Retest of previously failed issues

1. **Unknown routes / 404** — **PASS** (`NotFoundPage`, `/this-route-does-not-exist`).
2. **Rejected seller public visibility** — **PASS** (`getPublicSellerProfile` approval-only).
3. **Seller Fleet checkout validation** — **PASS** (fleet gated; 3PL Coming Soon).
4. **Sold listing seller information** — **PASS** (not “Motodo Seller”).
5. **SPA navigation flash** — **PASS** for blank/unavailable takeover. Residual one-frame previous page: **LOW**.
6. **Last-unit checkout** — **PASS** (placing overlay; confirmation, not unavailable).
7. **Homepage featured listings** — **PASS** (sold listings excluded).
8. **Category cards** — **PASS** (`/browse?category=`).
9. **Inventory copy** — **PASS** (`unitsLeftMessage`).
10. **Order / inventory edge cases** — **PASS** at that time (10→3→7 remaining-7 then cancel restore).
11. **Code quality / regression** — **PASS**.
12. **Build** — **PASS**.

### Round 1 counts

**TOTAL RETESTED:** 12  
**PASSED:** 12  
**FAILED:** 0  
**BLOCKED:** 0  
**NOT TESTABLE:** 0 (for the FAIL-fix set)

**HIGH:** 0  
**MEDIUM:** 0  
**LOW:** 1 — one-frame SPA previous-page snapshot during route commit.

---

## ROUND 2

Browser/manual verification of flows that were previously not testable. **PASS is claimed only where exercised in the running app.** No product code was changed in this round.

**Accounts used:** `admin@motodo.id`; approved Dewi `dewi.twins@motodo.test`; newly approved Raka `raka.garage@motodo.test`; rejected Sinta `sinta.cafe@motodo.test`; buyer `qa.buyer@motodo.test`. Mock password: 8+ characters (`password1`).

### Round 2 counts

**TOTAL TESTS:** 78  
**PASSED:** 61  
**FAILED:** 2  
**BLOCKED:** 0  
**NOT TESTABLE:** 15  

**HIGH:** 0  
**MEDIUM:** 2  
**LOW:** 5 (includes Round 1 SPA snapshot; not re-fixed)

### 1. Admin E2E

| Check | Status |
| --- | --- |
| Admin login, dashboard, seller management | **PASS** |
| Approve pending Kemang (`seed-seller-pending` / Raka) | **PASS** — public `/sellers/seed-user-pending` = Kemang Custom Works / Verified |
| Raka `/seller/listings/new` (approved tools) | **PASS** — listing form |
| Reject Cirebon (`seed-seller-pending-2` / Sinta) | **PASS** — public `/sellers/seed-user-pending-2` = Seller not found |
| Sinta `/seller/listings/new` | **PASS** — redirected `/seller/dashboard`; Add Motorcycle disabled; rejection reason shown |
| Listings list + T120 hide/approve | **PASS** — Hide → draft / public not found; Approve → active |
| Admin order `MTD-AF178B62` | **PASS** — buyer, listing, qty, totals, 2% fee, net |
| Users + QA Buyer detail | **PASS** |
| Reviews list (before any review existed) | **PASS** empty state |
| Review moderation **after** 1-star existed | **NOT TESTABLE** — admin reviews not re-opened after `motodo_reviews` had 1 row |
| Buyer / seller / logged-out `/admin` | **PASS** — buyer & Dewi → `/profile`; logged-out → `/login?next=%2Fadmin` |

**LOW (not FAIL):** admin listing/order rows for catalog-only sellers show “Unknown seller” / business name “Seller”.

### 2. Seller order E2E

Created `MTD-63E27564`: T100, qty **3**, pickup, bank transfer.

| Check | Status |
| --- | --- |
| Seller receives / lists new order | **PASS** — Dewi `/seller/orders/MTD-63E27564` |
| Buyer name/email/phone | **PASS** — QA Buyer, `qa.buyer@motodo.test`, phone `—` (existing fields) |
| Listing, qty 3, buyer total Rp 474.000.000 | **PASS** |
| Success fee 2% = Rp 9.480.000; net Rp 464.520.000 | **PASS** |
| Pending → Confirm → Mark Completed | **PASS** — Confirm then Mark Completed; cancelled not offered after confirm |
| Buyer completed order + review form | **PASS** |
| Revenue after complete | **PASS** — gross 474.000.000, fee 9.480.000, net 464.520.000; cancelled excluded; pending 241F81F0 excluded |
| Notifications | **PASS** — buyer `order_confirmed`, `order_completed`, `review_reminder`; seller `new_order` |

### 3. Order cancellation

| Check | Status |
| --- | --- |
| Existing cancelled `MTD-D3DEFEAD` (qty 7, Round 1 cancel) | **PASS** — buyer page has no review form; dashboard Cancelled Orders = 1; GTV excludes it |
| Fresh cancel click on leftover pending `MTD-241F81F0` | **NOT TESTABLE** this round (left pending to finish 10→3→7→0) |
| Inventory restore | **PASS** historically (Round 1 cancel restored T100); not re-clicked after sold-out |
| Complete after cancel | **NOT TESTABLE** this round (no Mark Completed on cancelled UI when not opened as seller) |

### 4. Inventory 10 → 3 → 7 → 7 → 0

Setup: Dewi edit T100 quantity **10**, save.

| Step | Result | Status |
| --- | --- | --- |
| 10 available | Checkout “Available: 10 units” | **PASS** |
| Buy 3 | `MTD-63E27564`; qty **7** | **PASS** |
| Buy remaining 7 | `MTD-CC60EB24`; confirmation **Order Placed Successfully** (not unavailable) | **PASS** |
| 0 / SOLD | `quantity: 0`, `status: sold`; Buy Now disabled; later checkout “no longer available” | **PASS** |
| Homepage featured | T120, Chopper, CB400, XSR — **no T100** | **PASS** |
| Negative qty / duplicate deduct on last-7 | Last-7 succeeded once; listing 0 | **PASS** for that purchase |

**FAILED (MEDIUM) — pending stock not reserved**

- **Reproduction:** With T100 showing 7 available, leftover pending `MTD-241F81F0` (qty 3, 5 Sept) still existed. Buyer purchased remaining 7 (`MTD-CC60EB24`). Listing went sold/0 while **pending 3 + pending 7 + completed 3** = 13 units ordered against a 10-unit listing (cancelled 7 not counted).
- **Expected:** Available quantity should not ignore open pending orders, or pending should reserve stock.
- **Actual:** Checkout used listing `quantity` only (`isListingPurchasable` / `placeOrder`).
- **Route/component:** `CheckoutPage`, `src/lib/orders.ts` `placeOrder`, `src/lib/listings.ts`.
- **Root cause:** No reservation of pending order quantity.
- **Fixed:** No (Round 2 is verify-only; no new features).
- **Retest:** N/A.

### 5. Reviews E2E

| Check | Status |
| --- | --- |
| Review completed `MTD-63E27564` | **PASS** — 1 star + comment |
| Persist + refresh | **PASS** — Reviewed + quote remains |
| Verified Purchase | **PASS** |
| Cannot review pending `MTD-241F81F0` | **PASS** — no Rate Your Purchase |
| Cannot review cancelled `MTD-D3DEFEAD` | **PASS** |
| Second review UI | **PASS** — form gone after submit (no second form) |
| Listing rating | **PASS** — `/motorcycles/seed-listing-bandung-twin` 1.0 / 1 review |
| Seller rating on listing | **PASS** — Seller Rating section populated (not “no reviews”) |
| Seller reviews page as Dewi after review | **NOT TESTABLE** — not re-opened as Dewi |
| Other buyer cannot review this order | **NOT TESTABLE** — Maya/Raka not logged in after review |
| Admin review moderation | **NOT TESTABLE** — not re-opened as admin |

### 6. Notifications E2E

Triggered via real flows: chat send, new order, confirm, complete, prior cancel, listing sold, review reminder.

| Type | Recipient | Status |
| --- | --- | --- |
| `new_message` | Dewi | **PASS** |
| `new_order` | Dewi | **PASS** |
| `order_confirmed` / `order_completed` | QA Buyer | **PASS** |
| `order_cancelled` | QA Buyer (existing) | **PASS** |
| `listing_sold` | Dewi | **PASS** created (also **stale** — see LOW) |
| `review_reminder` | QA Buyer | **PASS** |
| `listing_low_inventory` | — | **NOT TESTABLE** — T100 never sat at ≤2 while active |
| Seller approve/reject status to seller | Raka/Sinta | **FAILED** (MEDIUM) |

**UI:** Dewi `/notifications` — individual click marks read; unread decreases; Mark all as read; reload still Read. Duplicate **ids** none. Multiple `new_message` / `new_order` rows are **different events/orders**, not cloned ids.

**FAILED (MEDIUM) — seller registration status**

- **Reproduction:** Admin approve Raka / reject Sinta. Seller inbox has no approve/reject (or `seller_registration`) item. `seller_registration` is created for **admin** on seller apply only (`notifyAdminSellerRegistration`).
- **Expected (Round 2 list):** seller registration **status** notification to the seller.
- **Actual:** sellers are not notified of approval or rejection.
- **Route/component:** `src/lib/seller.ts` `approveSeller` / `rejectSeller`; `src/lib/notifications.ts`.
- **Root cause:** No `createNotification` on approve/reject.
- **Fixed:** No.
- **Retest:** N/A.

**LOW:** Dewi still had “Motorcycle Sold / T100 sold out” from an earlier sold-out, after cancel restored stock and qty was set back to 10. Notification is not retracted.

### 7. Seller dashboard consistency (Dewi, after qty-3 complete, before last-7)

Manual check vs `MTD-63E27564`:

- Listings: 3 total, 1 active, 1 draft, 1 sold (Scrambler) — **PASS**
- Orders: 3 total, 1 pending (`MTD-241F81F0`), 0 confirmed, 1 completed, 1 cancelled — **PASS**
- Revenue: 474.000.000 / fee 9.480.000 / net 464.520.000 = 474M × 2% — **PASS**
- Pending 474.000.000 explicitly not in revenue — **PASS**
- Inventory: 7 units on active T100 — **PASS** at that moment
- Messages: unread 3 / thread with QA round 2 text — **PASS**
- Reviews: none yet at that screenshot — **PASS** then; after review, dashboard not re-opened

After last-7, T100 is sold; Dewi dashboard **not** re-verified (would expect active 0, sold 2, inventory 0).

### 8. Mobile QA (~375 × 812)

`Emulation.setDeviceMetricsOverride` 375×812. `scrollWidth === 375` (no document-level horizontal overflow) on homepage, browse, T100 detail, messages.

| Page | Status |
| --- | --- |
| Homepage | **PASS** — hamburger; featured cards; no overflowX |
| Browse | **PASS** — Filters button; pagination |
| Motorcycle detail | **PASS** — Buy Now / Chat present |
| Checkout (sold T100) | **PASS** — unavailable heading (visited at 375 after sold) |
| Messages | **PASS** — composer + Send; no overflowX |
| Seller dashboard | **NOT TESTABLE** at 375 as Dewi (buyer redirected to `/profile`) |
| Admin dashboard | **NOT TESTABLE** at 375 as admin (buyer redirected to `/profile`) |

### 9. Tablet QA (~768 × 1024)

Homepage `scrollWidth === 768`. Browse loads with search + Filters + cards. Motorcycle/checkout/messages/seller/admin **not** fully re-walked at 768.

**NOT TESTABLE:** full tablet pass on seller/admin dashboards.

### 10. Data integrity

Reload of Dewi notifications: read state persisted. After review reload: review persisted. Session still present (`motodo.session`).

localStorage keys: `motodo.session`, `motodo.listings` (7, no dup ids), `motodo_reviews` (1), `motodo_orders` (7), `motodo_notifications` (19), `motodo_conversations` (2), `motodo.users` (7), `motodo_chat_messages` (4), `motodo.sellerProfiles` (5). **No duplicate record ids.**

### 11. Authorization final check

| Attempt | Result | Status |
| --- | --- | --- |
| Buyer `/admin` | `/profile` | **PASS** |
| Buyer `/seller/dashboard`, listing edit, `/seller/orders` | `/profile` | **PASS** |
| Logged-out `/admin` | `/login?next=%2Fadmin` | **PASS** |
| Dewi `/admin` | `/profile` | **PASS** |
| Dewi edit Jakarta `sportster-1200` | no permission | **PASS** |
| Dewi order `MTD-42BB4AB2` (other seller) | no permission | **PASS** |
| Seller A → Seller B listing (catalog T120 edit) | Listing not found until hydrated | **PASS** (deny, not leak) |
| Maya on QA order URL | **NOT TESTABLE** this round |

Login `?next=` still ignored (lands `/`) — **LOW**, unchanged.

### 12. Build

`npm run build` (`tsc -b && vite build`) **PASS** (exit 0). Vite >500 kB chunk warning only.

---

## Round 2 failures (detail)

### F2-1 MEDIUM — Pending orders do not reserve inventory

See ROUND 3 BUG 1. **Fixed:** yes. **Retest:** PASS.

### F2-2 MEDIUM — Seller is not notified of approval or rejection

See ROUND 3 BUG 2. **Fixed:** yes. **Retest:** PASS.

### LOW (not treated as Round 2 FAIL blockers)

1. One-frame SPA previous-page snapshot (Round 1; still observed, e.g. messages after Chat Seller).
2. Stale `listing_sold` after inventory restored / qty edited back.
3. Payment **Status: Pending** on completed and cancelled buyer order pages (`paymentStatus` not tied to order status).
4. Catalog-only sellers: admin “Unknown seller”.
5. Login `?next=` ignored.

---

---

## ROUND 3

Fixes for the two Round 2 MEDIUM issues. Verified in the running app at `http://127.0.0.1:5173` on 6 September 2026. No Supabase. No commit/push.

Listing used: Triumph Bonneville T100 (`seed-listing-bandung-twin`). Buyer `qa.buyer@motodo.test`. Seller Dewi `dewi.twins@motodo.test`. Admin `admin@motodo.id`.

### BUG 1 — Pending stock reservation

**Reproduction:** Listing quantity 10. Buyer creates a pending order for 3. Browse/detail/checkout still treated raw `listing.quantity` as purchasable, so a second buyer could order 7 while 3 remained pending (10 reserved against 10 total after a seller qty overwrite). Pending + completed could exceed true stock.

**Root cause:** `placeOrder` deducted `listing.quantity` immediately (or after a seller overwrite, validated against raw quantity). Pending/confirmed orders were not subtracted from available stock. Cancel restored via `inventoryRestored`; complete did not deduct again — but available UI ignored open reservations.

**Fix:** Total stock stays on `listing.quantity`. Pending and confirmed orders reserve units (`src/lib/inventory.ts`). Available = max(0, total − reserved). New orders validate available. Cancel releases the reservation (no double restore for `inventoryRestored: true`). Complete deducts total stock once. Listing sold/active follows available. Buyer-facing quantity is purchasable units. One-time migration adds back units previously deducted on pending/confirmed orders.

**Test result:** PASS (TEST 1–5, sold-out edge, dashboard Available: 7 after complete).

### BUG 2 — Seller approve/reject notifications

**Reproduction:** Seller apply created an admin `seller_registration` notification. `approveSeller` / `rejectSeller` did not create a notification for `profile.userId`. Reloading admin did not notify either (no notify on view) — the gap was the missing transition notify.

**Root cause:** Decision helpers wrote seller status only. No `createNotification` for the applicant.

**Fix:** On actual status transition, notify the seller (`userId: profile.userId`, type `seller_registration`, unique by user+type+relatedId+title). Approve and reject copy as specified; reject includes reason when present. Repeat view/reload does not notify. Seller A cannot see Seller B’s notifications (`getNotifications` is user-scoped).

**Test result:** PASS (TEST 6–8). Maya (`seed-user-approved-2`) received exactly one approval notification. Sinta (`seed-user-pending-2`) received exactly one rejection including “Incomplete showroom photos.” Dewi/Raka received none of those. Reloading admin seller pages did not duplicate.

### TEST 1–9

| Test | Result |
| --- | --- |
| 1 Stock 10 → pending 3 → available 7 (`MTD-068E2E2A`) | **PASS** |
| 2 With 3 reserved, qty 8 rejected (Place Order disabled, “Only 7 units left”) | **PASS** |
| 3 Second order qty 7 allowed (`MTD-708D4C11`); available 0; listing `sold` | **PASS** |
| 4 Cancel pending releases reservation; after cancelling 7 then 3, available 10, listing `active` | **PASS** |
| 5 Complete `MTD-F24A9069` (pending→confirmed still qty 10 / available 7; complete qty 7 / available 7; no double deduct) | **PASS** |
| 6 Admin approve Maya → one “Seller application approved” | **PASS** |
| 7 Admin reject Sinta → one “Seller application rejected” with reason | **PASS** |
| 8 Reload admin seller pages → still one each | **PASS** |
| 9 `npm run build` (`tsc -b && vite build`) | **PASS** |

### ROUND 3 RETEST

**TOTAL:** 9  
**PASSED:** 9  
**FAILED:** 0  
**BLOCKED:** 0  
**NOT TESTABLE:** 0  

**HIGH:** 0  
**MEDIUM:** 0  
**LOW:** 5 (unchanged from Round 2: SPA one-frame snapshot; stale `listing_sold` when stock returns; payment Status Pending on completed/cancelled; catalog-only Unknown seller; login `?next=` unused)

### MOTODO FRONTEND QA STATUS

Round 2 MEDIUM product bugs are fixed in the mock/localStorage app. Residual items are LOW mock-platform gaps, not inventory oversell or missing seller decision notifications.

**READY FOR SUPABASE: NO** — mock auth and localStorage remain; do not treat this as production inventory.

### SUPABASE BLOCKERS REMAINING

- Data and auth are still localStorage / mock login; no server session, RLS, or real roles.
- Admin is still client email match (`admin@motodo.id`), not a privileged server role.
- Inventory reservation and seller decision notifications must be reimplemented as server constraints/triggers (mock logic must not be the source of truth).
- Catalog listings without Motodo seller profiles (Unknown seller).
- Payment status is mock/pending; not a payment provider.
- `listing_sold` notifications are not reconciled when stock returns.
- Login redirect `?next=` unused.
- No automated E2E in CI.

Do not commit. Do not push. Do not integrate Supabase.
