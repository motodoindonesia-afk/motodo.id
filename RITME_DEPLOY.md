# Ritme deployment (ritme.motodo.id)

Ritme is the internal Motodo operations console. It is a **separate frontend build** in this repository. It uses the **same Supabase project** as https://motodo.id.

Do not change the existing Motodo Cloudflare Worker (`motodo-homepage`) or its GitHub integration to ship Ritme. Create a second Cloudflare Worker/project.

This document does not include secrets.

## Product split

| App | Domain | Audience | Build |
|---|---|---|---|
| Motodo | https://motodo.id | buyers + sellers | `npm run build` → `dist/` |
| Ritme | https://ritme.motodo.id | `public.profiles.role = admin` only | `npm run build:ritme` → `dist-ritme/` |

## GitHub

- Repository: `motodoindonesia-afk/motodo.id`
- Suggested production branch for Ritme: `cursor-homepage-v1` (same as Motodo), **or** a dedicated Ritme branch if you want independent releases.
- Do not disconnect the existing Motodo GitHub → Cloudflare integration.

## Cloudflare Worker / project

Create a **new** Cloudflare Workers project (example name: `ritme-motodo`).

Do **not** reuse `motodo-homepage`.

Suggested settings:

- Framework / build: Vite
- Build command: `npm run build:ritme`
- Output directory: `dist-ritme`
- Production branch: choose explicitly in the Cloudflare dashboard (do not retarget the Motodo Worker)
- Custom domain: `ritme.motodo.id`

SPA fallback (required so `/dashboard`, `/sellers`, etc. work on refresh):

- Use Static Assets `not_found_handling = "single-page-application"`, **or**
- The Ritme build emits `_redirects` with `/*    /index.html   200`

An example Wrangler file is in `ritme/wrangler.toml.example`. Copy it into a dedicated Cloudflare project. Do not place a live `wrangler.toml` in the Motodo Worker.

Example deploy (from this repo, after a Ritme build), only for the Ritme project:

```
npx wrangler deploy --config /path/to/ritme-worker-wrangler.toml
```

If Cloudflare builds from GitHub, set the Ritme project build command and output directory as above. Leave the Motodo project on `npm run build` / `dist`.

## Public environment variables

Set these on the **Ritme** Cloudflare project (same values as Motodo; they are public/publishable, not service role):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional:

- `VITE_MOTODO_PUBLIC_ORIGIN=https://motodo.id` (links from Ritme to public store pages)

Never set `SUPABASE_SERVICE_ROLE_KEY` or any `service_role` key on this frontend.

Production with missing/invalid URL or anon key shows a configuration error. It does not fall back to mock admin.

## Local development

```
npm run dev:ritme
```

Ritme runs on http://localhost:5174

Motodo remains:

```
npm run dev
```

Use the same `.env.local` public Supabase values for both (file is gitignored).

## Authorization reminder

Ritme UI checks `public.profiles.role === admin` after Supabase Auth. Buyers/sellers who visit ritme.motodo.id must be denied. Database RLS and admin RPCs remain the source of truth.
