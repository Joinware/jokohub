# JokoHub

**JokoHub** is Joinware’s live-chat product: website widget + shared team inbox + seat billing.

Niche: Senegal & Gambia SMB desks. Sibling to [WoLink](https://github.com/Joinware/wolink) (translation bridge) — WoLink is **not** in v1.

## Paid-beta scope

- Embeddable chat widget (`/widget.js`)
- Shared agent inbox (assign / resolve / reply)
- Orgs + owner/agent seats
- Stripe Checkout + portal + webhook **scaffold** (test keys via `.env.local`)
- Demo mode so you can run without Supabase (**explicit** `DEMO_MODE=true` only)

## Quick start (demo mode)

```bash
cp .env.example .env.local
npm install
npm run build:widget
npm run dev
```

Open:

- Marketing: http://localhost:3000
- Inbox login: `owner@demo.jokohub.app` / `demo1234`
- Widget demo: http://localhost:3000/demo-widget

## Production path

See [docs/DEPLOY.md](./docs/DEPLOY.md). Apply `supabase/migrations/001_init.sql`, set `DEMO_MODE=false`, add Supabase + Stripe test keys.

## Support

Default contact: `support@jokohub.app` (override with `NEXT_PUBLIC_SUPPORT_EMAIL`).
