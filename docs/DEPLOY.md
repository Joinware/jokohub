# Deploy JokoHub (paid beta)

## Architecture

- **App:** Next.js (Vercel recommended)
- **Auth + DB + Realtime:** Supabase Postgres
- **Billing:** Stripe test → live when ready
- **Widget:** static `public/widget.js` (built by `npm run build:widget`)

Demo mode (`DEMO_MODE=true`) uses an in-memory store and needs no cloud accounts.

## 1. Supabase

1. Create a project.
2. Run [`supabase/migrations/001_init.sql`](../supabase/migrations/001_init.sql) in the SQL editor.
3. Copy Project URL, anon key, and service role key into `.env.local` / Vercel env.
4. Set `DEMO_MODE=false` and `NEXT_PUBLIC_DEMO_MODE=false`.

## 2. Stripe (test)

1. Create a Product + recurring Price (e.g. $29/seat/month).
2. Set:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_PRICE_SEAT`
   - `STRIPE_WEBHOOK_SECRET` (endpoint: `https://<domain>/api/stripe/webhook`)
3. Subscribe to `customer.subscription.created|updated|deleted`.

Until keys are real, Billing UI returns a scaffold message instead of failing the app.

## 3. Vercel

```bash
npm run build
```

Set env vars from `.env.example`. Set `NEXT_PUBLIC_APP_URL` to the production URL.

## 4. Widget install

From **Settings → Widget**, copy the snippet onto customer sites. Restrict `allowedOrigins` before go-live.

## 5. Smoke checklist

- [ ] Signup creates org + owner seat
- [ ] Demo/storefront widget sends visitor message
- [ ] Inbox shows conversation; agent reply appears in widget (poll ~3s)
- [ ] Resolve / reopen works
- [ ] Stripe Checkout opens in test mode
- [ ] Webhook updates `stripe_subscription_status` / `seat_limit`

## Hosting note

Default path is **Vercel + Supabase**. Cloudflare Workers alone are a poorer fit for this Next.js inbox; keep Workers for WoLink.
