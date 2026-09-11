# JokoHub implementation plan

Living roadmap after paid-beta deploy. Production: [https://jokohub.vercel.app](https://jokohub.vercel.app) · deploy notes in [DEPLOY.md](./DEPLOY.md).

**Out of scope for v1:** carrier/Google RCS (RBM), WoLink as a required dependency.

---

## Current status (pilot)

Done:

- [x] Widget + shared inbox + orgs/seats on Supabase
- [x] Vercel deploy (`joinware/jokohub`) with demo mode off
- [x] Pilot seed (`owner@jokohub.app` / `pk_live_pilot_dakar_01`)
- [x] Demo storefront uses pilot widget key (not `pk_demo_jokohub`)
- [x] Dashboard `force-dynamic` for auth-gated pages
- [x] Realtime agent inbox (Supabase postgres_changes) + widget broadcast refresh

Open / ops:

- [ ] Supabase: Confirm Email off (or real SMTP) for signup reliability
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is a full secret in `.env.local` + Vercel (rotate if exposed)
- [ ] Stripe test keys + webhook so Billing is not scaffold-only
- [ ] Restrict widget `allowedOrigins` before real customer sites

---

## Product backlog (priority)

| Priority | Item | Notes |
|---|---|---|
| P0 | Auth + env polish | Unblocks desks signing up without your laptop |
| P0 | Stripe test | Checkout / portal / webhook → seat_limit |
| P1 | Team invites / multi-seat | Owner invites agents; seat_limit enforcement |
| P1 | Realtime inbox/widget | Inbox: postgres_changes. Widget: broadcast + slow poll fallback |
| P2 | **RCS-lite** | See below — not carrier RCS |
| P3 | Optional WoLink in inbox | Translate bridge; sibling product, optional |

---

## RCS-lite (not carrier RCS)

Goal: feel closer to rich chat (RCS-ish UX) inside the **website widget + shared inbox**, without RBM/carrier APIs.

### Non-goals

- Google Business Messaging / carrier RCS
- Video, location, payments, verified brand badges
- Full WhatsApp/iMessage parity

### Prerequisite: richer message model

Today `messages.body` is plain text only (`001_init.sql`). RCS-lite needs a migration, e.g.:

```text
messages
  body text              -- keep for plain text + caption
  content_type text      -- 'text' | 'image' | 'file' | 'chips' (start narrow)
  attachments jsonb      -- [{ url, mime, name, size }]
  meta jsonb             -- chips, reply-to, etc.
  delivered_at timestamptz
  read_at timestamptz
```

APIs (`/api/widget/messages`, inbox reply routes) and both UIs must understand `content_type` while remaining backward compatible with text-only rows.

### Phase A — Realtime + receipts (smallest high-value set)

1. **Realtime** — ✅ Inbox subscribes to `messages` / `conversations`; widget uses broadcast `jh-convo-{id}` + 15s poll fallback.
2. **Delivery / read receipts** — Set `delivered_at` when widget receives a message; `read_at` when panel is open / message visible. Show ticks or “Seen” in inbox + widget.
3. **Typing indicator** — Ephemeral channel or short-lived presence row; show “Visitor is typing…” / “Agent is typing…”.

**Done when:** agent reply appears in widget without waiting on the poll interval; both sides can see read state.

### Phase B — Image attach

1. Supabase Storage bucket (e.g. `chat-attachments`) with org-scoped paths + size/MIME limits (images first: jpeg/png/webp, ~5MB).
2. Signed upload from widget + inbox; store public/signed URL in `attachments`.
3. Render thumbnails in widget bubbles and inbox thread; open full size in new tab.
4. Abuse basics: authz on upload path, virus-scan later if needed.

**Done when:** visitor can send a photo from `/demo-widget` and agent sees it in inbox (and can reply with an image).

### Phase C — Suggested reply chips

1. Agent (or canned replies) can attach up to N chip labels on a message (`meta.chips: string[]`).
2. Widget renders chips under the bubble; tap sends that string as a normal visitor text message.
3. Settings: optional org-level quick replies for agents.

**Done when:** agent sends “Hours / Location / Talk to person” chips and visitor can answer with one tap.

### Phase D — Optional stretch (later)

- File attachments (PDF) beyond images
- Simple rich card (title + image + 1–2 actions) — only if desks ask
- Reactions (emoji on message) — low priority vs chips/images

---

## Suggested build order

1. Auth/SMTP + Stripe test (pilot hardening)
2. Realtime (Phase A foundation)
3. Read receipts + typing (finish Phase A)
4. Team invites
5. Image attach (Phase B)
6. Chips (Phase C)
7. WoLink translate (optional)

---

## Smoke checks (add as features land)

- [ ] Realtime: agent reply &lt;1s in open widget without relying on poll
- [ ] Read receipt: visitor opens thread → agent sees read
- [ ] Image: visitor upload appears in inbox; agent image appears in widget
- [ ] Chips: tap sends expected text message
- [ ] Text-only legacy messages still render
