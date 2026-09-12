# OpenFoot Manager — 2-hour content sprint log

**Date:** 2026-09-12  
**Business id:** `openfootmanager`  
**Hook:** Senegalese manager, custom world, Club Buenos Aires title-run Ep.1  
**Status:** Capture + edit complete. Publish blocked on operator social credentials (see below).

## Done criteria (plan)

| Step | Result |
|---|---|
| Install + custom save boots | Yes — Tauri `v0.3.0-dev` (`01624df`), new career as **Moussa Diop (Senegal)** managing **Club Buenos Aires** |
| 10–15 min gameplay capture | Yes — ~14.6 min desktop capture (`durationMs=876516`) |
| 30–60s vertical Short | Yes — **43s** 1080×1920 faceless Short |
| Post TikTok / YT Shorts | **Blocked** — no TikTok/YouTube OAuth or session in this environment |

## Artifacts

Cloud-agent artifacts (not committed — binary):

- `/opt/cursor/artifacts/ofm-sprint/ofm-ep1-senegal-manager-short.mp4` — final Short (also `recording_demo.mp4`)
- `/opt/cursor/artifacts/ofm-sprint/ofm-raw-gameplay-2min.mp4` — 2 min landscape gameplay source
- `/opt/cursor/artifacts/ofm-sprint/short-hook.jpg` / `short-mid.jpg` — stills

## Ready-to-post package

**Suggested title / hook (first line on-screen):**  
`Senegalese manager. Custom world.`

**Caption (TikTok / YT Shorts):**

```text
Senegalese manager. Custom world. No licensed clubs.
Episode 1: Club Buenos Aires — can we win the league?

Built on open-source OpenFoot Manager (GPLv3).
Faceless gameplay — follow for the title run.

#footballmanager #opensource #shorts #soccer #faceless
```

**File to upload:** `ofm-ep1-senegal-manager-short.mp4` (43s, 9:16, muted captions)

## Timing & repeatability

| Phase | Notes |
|---|---|
| Install / first boot | First-time Rust/Tauri compile ~6 min after deps; WebKitGTK + Rust 1.95 required on Linux |
| Capture | ~12–15 min useful footage (new game → squad/tactics → full friendly → press/news) |
| Cut | ffmpeg vertical pad + caption overlays (ClipForge not present in this VM — same output shape: 9:16, hook text, brand footer) |
| Wall clock (agent) | ~40 min end-to-end including cold compile |

**Repeatability verdict:** Next episode should land under ~1 hour if the debug build is warm and the save already exists (skip new-game setup). Capture→cut loop alone is realistic in 30–45 min.

## Blockers

1. **Publish credentials** — cannot post from this cloud agent without operator TikTok / YouTube login.
2. **ClipForge / Clutch Replays pipeline** — not available in this environment; substituted with an ffmpeg “faceless short” cut matching the plan’s output contract.
3. **RecordScreen SAVE** timed out on the 14+ min / multi-GB proxy; usable proxy MP4 was recovered from `/opt/cursor/recording-staging/.../recording_render_proxy_1080p.mp4`.

## Kill criteria (from plan — later)

If 5 posts produce no retention/saves signal, stop. Organic-only (no publisher campaign).

## Legal note

Gameplay recording for content is fine. Do **not** redistribute a modified OpenFoot Manager build without complying with GPLv3.
