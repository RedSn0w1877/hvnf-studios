# Transitions.dev snippet library

Self-contained CSS/JS transition recipes (pasted in by the studio lead, 2026-09-15). Each one is copy-paste CSS plus a tiny bit of state-toggling JS — no npm install, no runtime dependency. Pull whichever recipe fits a future build; none of these are wired into KROMA LABS because that page doesn't have a badge, modal, tabs, or morphing button anywhere in its UI.

Every recipe respects `prefers-reduced-motion: reduce` already — keep that guard when you copy one in.

## Number pop-in (React)
Digits pop in staggered, blurred-to-sharp. Good for animated stat counters / KPI tiles.
- Component: `NumberPopIn({ value })`, replay via a button.
- Styles auto-inject once on import (guarded by element id `transitions-p9`).

## Notification badge
`.t-badge` (absolutely positioned inside a `position: relative` trigger) slides in and pops. Toggle `data-open="true"/"false"`.

## Text state swap
`.t-text-swap` — three-phase JS-driven swap (`.is-exit` → change text → `.is-enter-start` → remove). For "Processing…" → "Done" style status text.

## Panel reveal
`.t-panel-slide[data-open]` — slide + fade + cross-blur. Set `--panel-translate-y` to the travel distance.

## Modal open/close
`.t-modal.is-open` / `.is-closing` — scale + fade, asymmetric open/close durations.

## Page side-by-side
`.t-page-slide[data-page="1"|"2"]` with child `.t-page[data-page-id]` — directional slide/fade/blur for two-page transitions.

## Tabs sliding pill
`.t-tabs` / `.t-tab` / `.t-tabs-pill` — JS writes `offsetLeft`/`offsetWidth` onto the pill's `transform`/`width`; snap to position on first paint and resize (suspend transition, force reflow, restore).

## Plus-to-menu morph
`.t-morph[data-open]` — a circular button that grows into a rounded panel, cross-fading a `+` icon into menu content.

---

Full CSS/JS for each is on file with the studio lead's original message from 2026-09-15; ask before re-generating from scratch, since re-deriving would drift from the tuned timings/eases above (`--*-ease` custom properties per recipe).

See also: [[hvnf-studio-os]] for the studio's anti-vibe-coding rules — check a recipe against those bans (no bouncing/spinning, no gimmick chrome) before using it in client work.
