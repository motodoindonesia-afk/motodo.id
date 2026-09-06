# Motodo.id — Production readiness (Phase J/K)

Static preparation after Phases B–I. **Not a live production go-live.** Payments stay mock. Mock/localStorage fallback is still in the codebase.

## Completed in this phase

- Confirmed frontend Supabase env is only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Confirmed `.env.local` / `.env.*` are gitignored; `.env.example` has placeholders only.
- Confirmed no `service_role` in `src/`.
- Auth client: `persistSession`, `autoRefreshToken`, `detectSessionInUrl`.
- Production never uses mock/localStorage when public Supabase env is missing or invalid (`ProductionConfigError`).
- Development without env still uses mock/localStorage.
- `/admin/users` reads `public.profiles` in Supabase mode (not `motodo.users`).
- Auth emails are not stored on `profiles`; the Email column shows "—" until a later Auth directory exists.
- User-facing error sanitizer so PostgREST/Postgres jargon is not shown in the UI (`src/lib/userFacingError.ts`).
- Documents: `ADMIN_SETUP.md`, `SUPABASE_PRODUCTION_CHECKLIST.md`, this file.

## 1. Environment

| Item | Status |
| --- | --- |
| Only two frontend Supabase vars | PASS |
| `.env.local` gitignored | PASS (`.env`, `.env.*`, `*.local`, `!.env.example`) |
| `.env.example` placeholders | PASS |
| No service_role in `src/` | PASS |
| Anon key in the Vite bundle | Expected for a browser client. **Never** put service_role in `VITE_*`. |

Missing or invalid vars in a **production** build show a configuration error page. Mock mode does **not** run in production.

## 2. Auth production readiness

| Item | Status |
| --- | --- |
| Signup / login / logout | PASS (GoTrue + `AuthProvider`) |
| Session persistence | PASS (`getSession` + `onAuthStateChange` + persistSession) |
| Protected routes → `/login?next=` | PASS |
| Admin = `profiles.role` | PASS in Supabase mode |
| Admin email | Mock mode only (`admin@motodo.id`) |
| Signup cannot self-register admin | PASS (`handle_new_user` sets `role = user`) |

**Dashboard (do not change from this repo):** Site URL `https://motodo.id`. Redirect allow list: `https://motodo.id`, `https://motodo.id/login`, `https://motodo.id/profile`.

## 3. Admin setup

See `ADMIN_SETUP.md`. SQL-only promotion. No frontend promotion UI.

## 4. Storage

- Bucket `listing-images`, public read: **intentional** for catalog photos.
- Upload path: `listings/<listing_id>/<uuid>.jpg`.
- Owner/admin policies + Phase I path helper/trigger.
- Create the bucket in the dashboard if the SQL insert is not allowed.

## 5. Database / RLS (Phases B–I)

Critical writes stay on RPCs: orders, chat, reviews, notification mark-read, seller approve/reject.

Direct client writes remain only where designed: `profiles` (safe columns), `seller_profiles` (own, pending/resubmit), `listings` / `listing_images` (owner + triggers).

Draft listings and draft stock are not public after Phase I hardening. Seller approval cannot be self-issued. Orders cannot be inserted/updated/deleted from the client.

Full static audit: `SUPABASE_SECURITY_AUDIT.md`. Runtime RLS still **REQUIRES LIVE TEST**.

## 6. Mock / localStorage fallback

| Area | Keys / behavior | Category |
| --- | --- | --- |
| Auth users/session | `motodo.users`, `motodo.session` | **MUST DISABLE BEFORE REAL PRODUCTION** if env is unset. Keep for local/dev. |
| Mock admin email | `admin@motodo.id` | **MUST DISABLE BEFORE REAL PRODUCTION** (ignored when Supabase is configured). |
| Listings | `motodo.listings` | **MUST DISABLE BEFORE REAL PRODUCTION** |
| Inventory migration | `motodo.inventoryReservationMigrated` | Mock-only. Same. |
| Seller profiles | `motodo.sellerProfiles` | **MUST DISABLE BEFORE REAL PRODUCTION** |
| Orders | `motodo_orders` | **MUST DISABLE BEFORE REAL PRODUCTION** |
| Chat | `motodo_conversations`, `motodo_chat_messages` | **MUST DISABLE BEFORE REAL PRODUCTION** |
| Reviews | `motodo_reviews` | **MUST DISABLE BEFORE REAL PRODUCTION** |
| Notifications | `motodo_notifications` | **MUST DISABLE BEFORE REAL PRODUCTION** |
| Seed catalog / seed sellers | in-code mocks when env unset | **SAFE TO KEEP FOR NOW** for local QA |
| Payments | `payment_status` stays pending; bank transfer / discuss | **REQUIRES FUTURE INTEGRATION** |
| Discounts | amount 0 | **REQUIRES FUTURE INTEGRATION** |
| Third-party logistics | checkout blocked / Coming Soon | **REQUIRES FUTURE INTEGRATION** |
| `/admin/users` | `public.profiles` in Supabase mode; `motodo.users` in **development mock only** | **SAFE TO KEEP FOR NOW** (dev mock). Production uses profiles. |
| Saved/favorites | existing local saved list | **SAFE TO KEEP FOR NOW** if it is per-browser UX only |

Fallback remains in **development** only. Production never enters mock mode.

Mode matrix:

| Environment | Valid `VITE_SUPABASE_*` | Behavior |
| --- | --- | --- |
| Development | No | Mock/localStorage |
| Development | Yes | Supabase |
| Production | Yes | Supabase |
| Production | No / invalid / placeholder | Configuration error page. **Never mock.** |

## 7. Routing

**Public:** `/`, `/browse`, `/motorcycles/:id`, `/sellers/:sellerId`, `/sellers/:sellerId/reviews`, `/login`, `/signup`

Public listing/seller pages use `getPublicListingById` / `getPublicSellerProfile` (no drafts, only approved sellers). RLS also hides drafts.

**Logged-in:** `/profile`, `/sell`, `/saved`, `/favorites`, `/checkout/:listingId`, `/orders`, `/orders/:orderId`, `/notifications`, `/messages`, `/messages/:id`, `/seller/register`

**Seller (has seller profile):** `/seller`, `/seller/dashboard`, `/seller/profile`, `/seller/orders`, `/seller/messages`, `/seller/reviews`

**Approved seller:** `/seller/listings*` (create/edit/preview). Other sellers’ listings: access message, not the editor. DB still enforces ownership.

**Admin:** `/admin` and nested routes. Unauthenticated → login. Non-admin → `/profile`. RPCs still require `is_admin()`.

Unknown paths → not found.

## 8. Error handling

Repositories pass PostgREST errors through `userFacingMessage` / `throwUserFacing`. Known Motodo RPC sentences stay. Technical SQL/JWT/RLS text is replaced with a generic fallback. Auth login/signup already maps GoTrue errors in `authMessage()`.

## 9. Build / deploy

- `npm run build` is the production check.
- This phase does **not** deploy.
- Host must SPA-fallback to `index.html`.

## Remaining before real customers / payments

1. Apply all SQL + storage + Realtime + Auth URLs (checklist).
2. Production host **must** set valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Payment gateway (payments remain mock).
4. Live RLS/Realtime/concurrency QA.
5. Email confirmation UX (signup may return no session until confirm).
6. Logistics / discounts if those are sold as live features. Auth email is not on `profiles` (`/admin/users` Email column may be "—").

## Known limitations

- Payments mock; success fee is still 2% of buyer total in **order math**, not a charged gateway.
- 3PL Coming Soon.
- localStorage data is not migrated into Supabase.
- No scheduled review-reminder job.
- Promoting admin is dashboard SQL only.
