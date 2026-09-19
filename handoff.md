# HVNF Studios — Agent Handoff

You're picking up mid-project. Read this whole file before touching anything. It covers what the business is, what's built, what's deployed, what's broken, and the specific traps that have already bitten us.

---

## 1. Who we are

**HVNF Studios** — a web dev / digital modernization studio. We build bespoke Next.js sites for local and high-ticket service businesses (automotive, trades, medical, fitness, dining, professional services). Two people: the studio lead (frontend/architecture/deploys) and Nathan (outreach and closing), 50/50.

Philosophy is **"show, don't tell"** — build the real thing and hand it over, rather than pitching abstractions.

**Read `CLAUDE.md` at the studio root.** It is the operating manual and it overrides your defaults. The parts that matter most:

- **Voice:** chill and casual, friendly terms. Do the work, but explain what things do as you go — what a library is for, what a command did, why a pattern exists. Educational, not lecturing.
- **Anti-"vibe-coding" bans (hard rules):** no purple/neon SaaS gradients, no dot grids, no blurry glow orbs, no glassmorphism, no fake terminal windows, no `Sparkles` icons, no generic 3-feature bento grids, no identical 3-tier pricing cards, no colored left-border stripe cards, no bouncing arrows or infinite spinners.
- **Copy bans:** no "It's not X, it's Y" constructions. No empty buzzwords ("streamlined", "supercharged", "next-gen"). Never fabricate testimonials. Terms and Privacy links must actually work.
- **Motion:** purposeful, subtle reveals only.

---

## 2. What's built

Three portfolio sample sites are planned. **Two are done and live. The third hasn't been started.**

### Site 1 — KROMA LABS (`kroma-labs/`)

Fictional brand: billet-aluminum 75% mechanical keyboards. Aesthetic is industrial brutalist luxury — carbon/steel/hairline borders with a safety-orange accent (`#ff4400`).

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, `@react-three/fiber` + `@react-three/drei` + `three`, `gsap` + `@gsap/react` (ScrollTrigger), `lenis`, `motion/react`, `lucide-react`, `border-beam`
- **Dev:** `npm run dev --prefix kroma-labs` → http://localhost:3000
- **Features:** 3D exploded-view keyboard (82-key 75% layout, sculpted keycaps with per-row tilt and dished tops, legend texture atlas), GSAP ScrollTrigger pinned explode sequence driven by a plain mutable store, Lenis smooth scroll bound to GSAP's ticker, Web Audio switch synthesis (no audio files), spec sheet, allocation form

### Site 2 — APEX DYNAMICS (`apex-dynamics/`)

Fictional brand: carbon-plated trail running shoes ("Prototype 04"). Aesthetic is high-contrast athletic — void black `#050505`, carbon `#0c0c0e`, gridlines `#1f1f23`, chalk `#f5f5f5`, acid volt `#ccff00`. Kinetic italic display type.

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, `motion/react`, `lucide-react`, `sonner`, `canvas-confetti`. **Deliberately no 3D/GSAP/Lenis** — this one is pure CSS/SVG/motion.
- **Dev:** `npm run dev --prefix apex-dynamics -- -p 3001` → http://localhost:3001
- **Features:** kinetic headline, marquee ticker, magnetic hover CTA, scrubbable SVG telemetry HUD (interpolated 30km dataset — drag, click, or arrow keys), tabbed peel-away spec cards, wind-tunnel drag comparator (real v³ drag-power math), allocation form with palette-tinted confetti + toast

**Note on the Apex palette:** the void/volt palette and kinetic italic type were specified directly by the studio lead for this piece, overriding the default per-vertical palettes in `CLAUDE.md`. That's intentional and documented in its README — don't "fix" it.

---

## 3. Deployment — read this before you push

Both sites are live on GitHub Pages under the account **`RedSn0w1877`**:

| Site | Repo | Live |
|---|---|---|
| KROMA LABS | `github.com/RedSn0w1877/kroma-labs` | https://redsn0w1877.github.io/kroma-labs/ |
| APEX DYNAMICS | `github.com/RedSn0w1877/apex-dynamics` | https://redsn0w1877.github.io/apex-dynamics/ |

**Push to `main` = auto-deploy.** Each repo has `.github/workflows/deploy-pages.yml` which builds the static export and publishes it. Pages source is set to "GitHub Actions" (`build_type: workflow`). `gh` CLI is installed and authenticated (scopes include `workflow`, which GitHub requires before a push may touch files under `.github/workflows/`).

### GitHub Pages gotchas already solved — do not regress these

1. **`basePath` is production-only.** Pages serves project sites at `/<repo>/`, not the domain root, so `next.config.ts` sets `basePath` and `assetPrefix` gated on `NODE_ENV === "production"`. If you make it unconditional, **local dev 404s at localhost root** (this already happened). If you drop it, **every asset 404s in production**.
2. **`trailingSlash: true`** — static export writes `route.html` by default, but Pages only auto-serves `index.html` for a directory. Without this, `/legal/terms` 404s.
3. **`public/.nojekyll`** must exist — otherwise GitHub's Jekyll pass strips the `_next` folder (leading underscore) and the whole site loses its assets.
4. **`src/app/robots.ts` needs `export const dynamic = "force-static"`** or the static export build fails outright.
5. **Raw `<a href="/...">` tags are NOT rewritten by `basePath`.** Only `next/link`, `next/router` and `next/image` get the prefix. Internal path links must use `next/link`. The one exception is `<link rel="license">` in `layout.tsx`, which is a raw tag with the prefix hardcoded.

**After any deploy, verify against production — don't assume.** A 200 on the page is not enough; check that a real asset loads and that asset refs carry the prefix:

```bash
HTML=$(curl -s https://redsn0w1877.github.io/apex-dynamics/)
echo "$HTML" | grep -c '/apex-dynamics/_next/'   # should be > 0
echo "$HTML" | grep -oE '"/_next/' | wc -l        # MUST be 0
```

---

## 4. Copyright and watermarking — non-negotiable

Every portfolio piece carries copyright marks throughout, subtle and never blocking content. Both sites implement the same pattern. **Copy it for site 3:**

- `src/lib/copyright.ts` — shared constants (`COPYRIGHT_SHORT`, `COPYRIGHT_NOTICE`)
- `src/components/brand/watermark-rail.tsx` — fixed vertical © rail on the right edge, `xl:` and up, `pointer-events-none`
- `src/components/brand/sheet-mark.tsx` (KROMA) / `log-mark.tsx` (APEX) — per-section header strip that doubles as the copyright mark. KROMA styles it as an engineering drawing title block ("SHT 02/05"), APEX as a telemetry log ("LOG 03/06"). Same idea, different brand language.
- `src/components/brand/copyright-guard.tsx` — console notice, plus appends attribution when someone copies more than 120 characters
- Print watermark via `body::after` in `globals.css`
- Footer: full notice **plus a disclosure that the brand is fictional** and the specs/pricing are illustrative. This matters — the sites otherwise read as real products.
- `LICENSE` (all rights reserved), `package.json` `"license": "UNLICENSED"`, `robots.ts`, working `/legal/terms` and `/legal/privacy` pages

Also: both sites embed a maker's mark inside the work itself — KROMA engraves © on the 3D brass weight, APEX silkscreens it on the PCB. Fits the product, doubles as a mark.

---

## 5. Traps that have already cost us time

**Testing environment:**

- **Background browser tabs throttle `requestAnimationFrame`.** Animations freeze mid-flight and screenshots look broken when the site is fine. **Front the tab before screenshotting.** This produced several false "the site is broken" conclusions.
- **DOM probes beat screenshots.** Reading computed `opacity`/`transform`/`getBoundingClientRect` via `javascript_exec` is far more reliable than screenshots here, which time out often. A "blank section" was nearly fixed as a bug before a probe showed it rendered fine — it was a capture failure.
- **`globals.css` sets `scroll-behavior: smooth`.** When scripting scroll for tests, use `window.scrollTo({top, behavior: 'instant'})` or you'll screenshot mid-animation.
- **Test at real widths.** An entire Apex review was done at ~744px — below the `md` breakpoint — so the desktop layout went unseen while being called done. Check 1440px **and** 375px.

**Code bug classes found in both sites:**

- **Squished words.** Splitting a headline into `inline-block` spans separated by CSS `margin` produces no real space character. Screen readers and copy-paste get `ENGINEEREDFOR`. Emit an actual `" "` text node between words and give the heading a plain-text `aria-label`. Same defect hit telemetry readouts (`142bpm`) — put a real space between value and unit.
- **Don't gate content behind entrance animations.** `initial={{opacity: 0}}` on real content means it's invisible if animation never runs — throttled tab, failed hydration, slow device. Decorative reveals are fine; core content must render statically.

---

## 6. Boundaries that were held (hold them too)

- **Unverified npm packages:** `border-beam` and `liquid-gooey` were requested. I declined to run the installs; the studio lead ran them personally, and only then were they inspected (MIT, no install scripts) and used. Don't install code you can't verify — hand over the command instead.
- **`border-beam` is in use** on the KROMA allocation panel as an **explicit, documented one-off exception** to the anti-vibe-coding rules, approved by the lead. It's flagged in code comments. `liquid-gooey` was tried on nav and removed — it's uninstalled.
- **PP Editorial New (font):** the lead supplied the "free for personal use" package. Its EULA §2.1 explicitly forbids use "on a publicly available platform such as a website." **Do not embed it.** KROMA uses Fraunces (Google Fonts) as the editorial serif accent. If a commercial license is purchased, swapping is a one-file change in `layout.tsx`.
- **Public repos / pushes:** creating public repos and pushing was explicitly confirmed by the lead before doing it. Confirm before outward-facing actions.

---

## 7. Where things stand — your actual work

### Known-good
Both sites: typecheck, lint, and production build clean. Both deployed and verified live (assets, legal routes, robots.txt all 200). Apex's accessibility fix, two-column desktop hero, and spec diagram are confirmed in production.

### Outstanding on APEX DYNAMICS

1. ~~The shoe diagram is mediocre — highest priority.~~ **Done.** `src/components/ui/shoe-profile.tsx` replaced the hand-authored SVG side-profile with a ruled-geometry stack-height cross-section: filled midsole polygon (38 mm heel / 30 mm forefoot), dashed dimension lines reading `38 mm` / `30 mm`, a volt `8 mm drop` arrow, and a forked carbon-plate callout. Panel caption in `hero.tsx` updated from "Fig. 01 — Side profile" to "Fig. 01 — Stack section". Matches the technical-drawing language; no entrance animation; real text nodes with spaces preserved. (tsc/eslint/build not runnable in this local env — no next or typescript binaries, not a git repo; full check needed before push.)
2. **Mobile hero is too tall** — at 375px the diagram panel doesn't appear until ~1300px down. Tighten the type scale and vertical rhythm.
3. Benign: build warns `Failed to find font override values for font 'Big Shoulders'` — fallback metrics only, slight CLS impact, no functional effect.

### Site 3 — not started
Needs a vertical and a brief from the lead. It should contrast with the two existing pieces (industrial-luxury dark, and athletic high-contrast dark) — a **light** palette would show range. `CLAUDE.md` suggests per-vertical palettes: medical/dental (clean whites, clinic slate, surgical blue, sage), trades/automotive (slate, steel, amber), luxury/boutique (bone, charcoal, brass, serif pairings). **Ask before building** — the lead has given full detailed briefs for both previous sites and will likely want to do the same.

### Reference material
`reference/transitions-dev-snippets.md` — a library of reusable CSS/JS transition recipes (number pop-in, notification badge, text swap, panel reveal, modal, page slide, tabs pill, plus-to-menu morph) the lead saved for future builds. Check any recipe against the anti-vibe-coding motion rules before using it in client work.

---

## 8. Quick start

```bash
# KROMA LABS  → localhost:3000
npm run dev --prefix kroma-labs

# APEX DYNAMICS → localhost:3001
npm run dev --prefix apex-dynamics -- -p 3001
```

Verify before claiming done: `npx tsc --noEmit`, `npx eslint src`, `npm run build`, then look at it at **1440px and 375px** with the tab **fronted**.
