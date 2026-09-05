# MOTODO.ID

Marketplace homepage for custom and premium motorcycles in Indonesia.

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

This first version is the homepage only, using mock listings. Authentication, listings database, and payments are not connected yet.

## Later stages

- **Supabase:** copy `.env.example` to `.env.local` and add a client under `src/lib/` when you are ready.
- **Cloudflare:** `npm run build` outputs a static `dist/` folder, which can be published to Cloudflare Pages without extra setup in this version.
