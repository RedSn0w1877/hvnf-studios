# HVNF STUDIOS HANDBOOK

**FROZEN SNAPSHOT. DO NOT EDIT. DO NOT MOVE. DO NOT RENAME.**

Written 2026-09-20 by Claude (Sonnet 5, continuing work started by Opus 5) at the end of a long working engagement with the studio's Lead Architect. This is a point-in-time record. If reality has moved on, write your own new note next to it (for example `HANDOFF-<date>.md`); never rewrite this one. The short, living checklist is `HANDOFF.md` in the same folder. This file is the long explanation: who we are, what exists, how it was built, why, and how to pick the work back up.

Everything here is something I actually saw, wrote or was told. Where I am unsure, I say so. Where something was never verified, I say that too. Do not treat a gap as a fact.

If you are a human reading this, it is written for another AI agent, but it works as a company handbook too.

---

## Table of contents

1. What this place is
2. The people and how to work with them
3. The business model and roadmap
4. The three non-negotiable rules from the user
5. The repository layout
6. The tech stack, and why each piece is there
7. The plugin and library toolkit, one by one
8. Design rules: the anti-"vibe-coding" standard
9. Showcase pieces versus client work
10. The performance doctrine
11. The three portfolio sites in detail
12. The main HVNF Studios site in detail
13. The bug ledger: every real bug found, its cause, its fix
14. Conventions: copyright, commits, tone, files
15. Environment problems (the broken shell)
16. What is verified, what is not
17. How to pick the work back up, step by step
18. Open tasks, ranked
19. Things I would do differently
20. Glossary
21. Appendix: copy-paste snippets and reference patterns

---

## 1. What this place is

HVNF Studios is a small web studio. It builds fast, bespoke web apps for local and regional service businesses and replaces their broken legacy websites. The target customers are things like auto shops, trades, medical and dental practices, fitness studios, restaurants and professional services (law, luxury contractors). These are businesses where one phone call or booking is worth real money and where the existing site is slow, ugly or does not work on a phone.

The studio's core sales philosophy is **"Show, don't tell."** Instead of pitching, the team builds a working, mobile-first preview of a prospect's new site from their public footprint (reviews, photos, services), hands it to the decision maker, and removes purchase friction. The preview is the pitch.

Two people run it:

- **The Lead Architect / Product owner.** The person you are talking to in the chat. Owns frontend, Next.js, motion, deploys. This is who gives you instructions. Their git identity is "Hoa Vo". Their email appears in the environment block; use it only to identify them, never send it anywhere.
- **Nathan.** Outreach, lead generation, closing. Not in the codebase.

They split net profit 50/50.

The working folder is `C:\Users\Hoa Vo\Downloads\Code Projects\HVNF Studios`. The studio's own website lives at the root of that folder. Three portfolio sample sites live in subfolders.

There are four websites in the folder, and they have different jobs. Confusing them is the fastest way to do harm:

| Site | Folder | Job |
|---|---|---|
| HVNF Studios (real business site) | root `src/` | The studio's actual storefront. Real business, real customers. |
| Kroma Labs | `kroma-labs/` | Fictional product site (a billet-aluminum keyboard). Portfolio showcase. |
| Apex Dynamics | `apex-dynamics/` | Fictional product site (a racing shoe). Portfolio showcase. |
| Aetheria Botanicals | `aetheria-botanicals/` | Fictional slow-extraction botanical perfume atelier. Portfolio showcase. |

The three showcase sites are **not real companies**. They exist to prove the studio's range to prospects. Nothing on them is a real product, price, stock count or claim. Batch numbers, prices, "84/120 claimed" and similar are set dressing.

---

## 2. The people and how to work with them

### 2.1 Voice

The studio's `CLAUDE.md` sets the tone: **chill and casual, friendly. Do all the work, but explain what things do along the way** (what a library is for, what a command did, why a pattern exists). Educational, not a lecture. Keep replies short. Do not pad. Do not use emojis.

In practice the user writes casually, sometimes with heavy emphasis ("BIG FOCUS!!!!!!!!"). They mean it. They also tend to give big, energetic, sometimes sweeping instructions and expect you to just go. Match energy with competence, not with hype.

### 2.2 What the user cares about, in the order they showed it

1. **Cost.** They said "dont use workflows im running on usage credits" and later "go ahead and dont burn my credits". Treat this as a hard constraint (Section 4).
2. **Beauty and motion.** They want the studio's own site, and the showcases, to look like a motion-designed film. They called Aetheria "the best one out of the 3". That is now the quality bar.
3. **Performance.** "make sure performance is incorporated EVERY STEP OF THE WAY!!!! BIG FOCUS!!!!!!!!" Beauty may not cost frame rate.
4. **Mobile.** "make sure its screen size and mobile friendly too". Every site must work on a phone.
5. **Honesty in copy.** The studio's rules forbid fake testimonials and invented statistics.

### 2.3 How they give instructions

- Sweeping asks ("rebuild the site from the ground up") mean it. Do not incrementally patch when told to rebuild.
- "dont reuse just lock in and code" means build fresh, do not copy components from a sibling site.
- They will sometimes move work between agents ("the other agent is really unstable right now so I'm gonna transfer over here"). Expect to inherit half-finished, sometimes messy state. Audit it before trusting it (Section 13, item on the background agent's clutter).

### 2.4 Things that annoyed or would annoy them

- Spawning multi-agent workflows (costs money).
- Status-report clutter files committed to repos (earlier, another agent committed a pile of `COMPLETE.md`, `PERFORMANCE.md` style files; I deleted them). Do not create planning or report files unless asked. This handbook and `HANDOFF.md` exist because they explicitly asked.
- Claiming something works without proof.
- Fake social proof.

---

## 3. The business model and roadmap

From the studio's `CLAUDE.md`:

**Phase 1 (months 1 to 3).** $500 to $1,000 per build. 50% deposit, 50% before DNS transfer. 2 to 4 builds a month, about $2.5k/month baseline. A 3 to 5 page site deployed in under 8 hours.

**Phase 2 (months 4 to 12).** Care Plans at $99 to $199 a month (Vercel hosting, uptime monitoring, a monthly SEO report, one hour of updates). Builds rise to $1.5k to $3k. Target dental, specialty medical, luxury contractors, law. Goal: 25 retainers (about $3k+ MRR) plus $4k to $6k a month in builds.

**Phase 3 (year 2+).** 50+ retainers ($6k to $10k MRR), booking engines, portals, SMS, multi-location. $5k to $10k+ projects, referral driven.

Infrastructure named in `CLAUDE.md`: Vercel Edge, Cloudflare DNS, Stripe Invoicing.

**How this shapes the code.** The real site's Care and Closing sections describe a hosting/care plan. Do not put invented prices, uptime guarantees or SLA numbers on the real site unless the user gives them. The roadmap above is internal; it is not customer-facing copy.

---

## 4. The three non-negotiable rules from the user

These override convenience. They were repeated, so they matter.

### 4.1 No Workflow tool, no multi-agent fan-outs

The user is paying with usage credits. Earlier in the engagement a background Workflow (multiple subagents) built parts of Aetheria and repeatedly hit rate limits ("You've hit your session limit"). The user said not to use workflows, and later "dont burn my credits". Do the work directly, one agent, with the ordinary file tools. Do not spawn subagents unless the user explicitly asks. If a task genuinely seems to need fan-out, describe it and its rough cost and ask first.

### 4.2 Build fresh, do not reuse across portfolio sites

"dont reuse just lock in and code." Each showcase site has its own components. Shared *conventions* (a copyright constant file, motion easing constants, a `lib/` folder layout) are fine. Copy-pasting whole components between sites is not. Note: I did put an identical small hook, `use-media.ts`, in all three sites. That is a 15-line utility, not a component, and it is deliberately duplicated so each site stays independently deployable. That trade-off is intentional.

### 4.3 Never install packages yourself

Carried from earlier: do not run `npm install` for unverified packages on your own. Give the user the exact command and let them run it. Never fabricate testimonials, certifications, uptime, or performance numbers.

---

## 5. The repository layout

```
HVNF Studios/                     <- studio root; also the real business site
  CLAUDE.md                       <- studio operating rules (read it)
  HANDOFF.md                      <- short living checklist
  HVNF-HANDBOOK.md                <- this file (frozen)
  src/
    app/
      layout.tsx  page.tsx  globals.css
      legal/terms/page.tsx  legal/privacy/page.tsx
    components/
      site/        <- the current real components (Section 12)
      studio/      <- OLD components, now `export {};` stubs
    lib/
      perf.ts  gsap.ts
  .claude/launch.json             <- preview server configs
  reference/transitions-dev-snippets.md   <- saved transition recipes
  kroma-labs/                     <- portfolio sample #1
  apex-dynamics/                  <- portfolio sample #2
  aetheria-botanicals/            <- portfolio sample #3
```

The git log mentions "demo site submodules", so the three demo folders may be git submodules or separate repositories. **I never confirmed this, because the shell was broken.** Check with `git submodule status` and by looking for `.git` files or folders inside each demo folder before committing.

Live deploys: the three demos were deployed to GitHub Pages under the `redsn0w1877` GitHub account, at URLs of the form `https://redsn0w1877.github.io/kroma-labs/`, `.../apex-dynamics/`, `.../aetheria-botanicals/`. The real HVNF site has no deploy pipeline set up as far as I could tell.

Preview servers (from `.claude/launch.json`): kroma-labs on port 3000, apex-dynamics 3001, aetheria-botanicals 3002, the real HVNF site 3003 (`npm run dev -- -p 3003`). Start them through the preview tooling, not through ad-hoc shell background jobs.

Each demo site's `AGENTS.md` (Kroma's at least) carries a warning: this is a newer Next.js with breaking changes, read `node_modules/next/dist/docs/` before writing framework code. Take that seriously; Next.js here is 16.x and behaves differently from older versions you may remember.

---

## 6. The tech stack, and why each piece is there

Common to all four sites:

- **Next.js 16 (App Router), static export** (`output: "export"`). Static export means the build produces plain HTML/JS/CSS with no server. That is why there are no API routes or server actions, and why the real site's contact flow is a `mailto:` link (Section 12.6). Static hosting is cheap, fast and works on GitHub Pages.
- **React 19.** Newer lint rules apply (Section 13, "React 19 lint rules").
- **TypeScript, strict.**
- **Tailwind CSS v4.** Token-based via `@theme`. This is *not* Tailwind v3. Different directives, and a different (layered) cascade. See the two biggest bugs in Section 13.
- **motion/react** (this is Framer Motion, renamed) for component-level animation.
- **GSAP 3 + ScrollTrigger + `@gsap/react`'s `useGSAP`** for scroll-scrubbed, pinned and timeline animation.
- **Lenis** for smooth scrolling.
- **three + @react-three/fiber + @react-three/drei** for WebGL, with **custom GLSL shaders** where needed.
- **lucide-react** for icons, **sonner** for toasts, **canvas-confetti** for celebration moments.
- Showcase-only extras: **border-beam** and **liquid-gooey** (Apex uses `liquid-gooey`'s `Liquid` component in its mobile menu).

### 6.1 Why one animation loop

GSAP owns the frame clock. Lenis is driven from GSAP's ticker:

```ts
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

A second independent `requestAnimationFrame` loop is wasted work and was an actual bug in the original real-site page (Section 13, item 12). The rule: **one loop per page.**

### 6.2 Why one WebGL context

Each `<Canvas>` is a GPU context. Phones handle few well. The real site therefore draws its entire animated background (colour field, wire terrain, motes) inside a single shared canvas (`stage.tsx`). The showcase sites are limited to one canvas at a time on phones (Section 11).

---

## 7. The plugin and library toolkit, one by one

The studio's `CLAUDE.md` says showcase builds should use "the whole toolkit, not a subset". Here is what each piece is for, in plain language, so you can decide when to reach for it.

**Lenis.** Smooth, inertia-based page scrolling. Makes scroll feel like butter instead of stepped. Must be paired with GSAP's ticker (Section 6.1). Anchor links should hand off to Lenis (`lenis.scrollTo`) so they get the same easing. Kills itself on unmount (`lenis.destroy()`), and you must cancel any manual rAF id you own.

**GSAP.** The industrial animation engine. Use timelines for choreography (sequence, overlap, stagger). Use `ScrollTrigger` to tie a timeline to scroll position (`scrub`), to pin a section while it plays (`pin: true`), and to run code when a section enters. `useGSAP` from `@gsap/react` is the React-safe hook: it scopes selectors to a ref and cleans up tweens automatically. Register plugins once, client-side only (`src/lib/gsap.ts` in each project). Gotcha: GSAP fires an initial synchronous `onUpdate` while a tween is still being constructed. Do not reference the tween's own `const` inside its own `onUpdate` arrow (temporal dead zone). Use `onUpdate(this: gsap.core.Tween) { ... this.progress() }` (Section 13, item 6).

**ScrollTrigger config.** The real site sets `ScrollTrigger.config({ ignoreMobileResize: true })` so phone URL-bar show/hide does not trigger layout recalculation and jank.

**motion/react (Framer Motion).** Declarative component animation: mount/unmount transitions (`AnimatePresence`), layout animations (`layoutId`, used for the moving nav underline on Apex), springs, `whileInView`, `useScroll`, `useTransform`, `useMotionValueEvent`. Use for UI micro-interactions. Use GSAP when you need scrubbed, pinned or long multi-element sequences. Always respect `useReducedMotion()`.

**three / @react-three/fiber / drei.** three.js is the 3D engine. R3F lets you write scenes as React components. drei is a helper library (controls, loaders, etc.). Use `useFrame` for per-frame updates. Frameloop modes matter for performance: `"always"` (render every frame), `"demand"` (render only when you call `invalidate()`), `"never"` (stopped). The real site uses all three (Section 12.3).

**Custom GLSL shaders.** Used for the real site's background field and terrain, and Aetheria's mote and vapour points. Critical gotcha: if the same uniform is declared in both the vertex and fragment shader, both must use the same `precision` qualifier or the program fails to link ("Precisions of uniform 'X' differ between VERTEX and FRAGMENT shaders"). Vertex shaders default to `highp`, fragment shaders have no default in WebGL1, so put an explicit `precision mediump float;` (or `highp`) on both.

**border-beam.** An animated glowing border sweep for cards/buttons. Showcase flourish. In this engagement the user declined installing it for Aetheria ("Skip those two"), so it is not there.

**liquid-gooey.** A "gooey"/metaball SVG-filter effect. Apex uses it for the mobile menu button (a volt slab with a droplet that flicks off when the menu opens). Decorative only, `aria-hidden`, `pointer-events-none`, rendered client-side only to avoid hydration issues.

**sonner.** Toasts. **canvas-confetti.** A one-shot particle burst; the real site fires it (dynamic import) only on an actual successful send, never on load.

**lucide-react.** Icon set. Note the studio bans the `Sparkles` icon specifically (Section 8).

**`reference/transitions-dev-snippets.md`.** A saved library of reusable transition recipes, referenced by `CLAUDE.md` and by a memory entry. Consult it before inventing a transition.

**Design-oriented skills available in the agent environment** (not required, listed so you know): a `ui-ux-pro-max` suite (design systems, palettes, font pairings, GSAP motion presets), `artifact-design`, `code-review`, `simplify`, and others. Use them if they help; none are mandatory.

---

## 8. Design rules: the anti-"vibe-coding" standard

These come straight from the studio's `CLAUDE.md`. The point: client sites must not look like generic AI output.

### 8.1 Visual bans

Purple-on-black neon. Electric gradients. Pastel blobs. Mock terminals. Dot grids. Blurry radial orbs. Glassmorphism. `Sparkles` icons. Generic three-feature bento grids. Identical three-tier pricing cards. Colored left-border stripe cards. Bouncing arrows. Infinite spinners. Aggressive hover zooms.

### 8.2 Motion (client work)

Subtle and performant reveals only.

### 8.3 The three-second rule (applies everywhere, showcases included)

A visitor must know **what the product is within three seconds.** Lead with plain language, then earn the jargon. Technical vocabulary is seasoning, not the meal. If the hero does not say what the thing *is*, the build has failed, however good the motion is.

### 8.4 Palettes by industry

- Trades / Auto: slate `#09090b`, steel, amber / burnt orange.
- Medical / Dental: neutral whites, clinic slate, surgical blue, sage.
- Luxury: bone, charcoal, muted brass, serif pairings.

### 8.5 Copy bans

Never "It's not X, it's Y". No tech jargon aimed at non-tech brands ("streamlined", "supercharged", "next-gen", "paradigm"). Speak to real pain points ("Same-Day Emergency Service", "Upfront Estimates").

### 8.6 Social proof and legal

Never fabricate testimonials; pull real review sentiment. Always ship working Terms and Privacy links. (The real site had dead legal links until the rebuild; they now resolve, Section 12.)

### 8.7 Watermarks

Portfolio pieces carry "© HVNF Studios, do not redistribute" copyright and watermarks throughout, subtle and never blocking content.

---

## 9. Showcase pieces versus client work

The bans in Section 8 exist to stop *client* sites looking like slop. Showcase pieces have the opposite job: prove range. On a showcase, go maximal:

- WebGL and 3D, GPU particle fields, transforming/exploding models, scroll-scrubbed GSAP timelines, pinned sequences, kinetic typography, magnetic and parallax interactions, shader effects.
- Target feel: a motion-designed film. After Effects, not a brochure.
- Use the whole toolkit.
- **Still banned even on showcases:** the cheap tells. Purple/indigo SaaS neon, fake terminals, dot grids, `Sparkles` icons, glassmorphism. "Aggressive is fine; generic is not."

**Where the real HVNF site sits.** It is neither a client site nor a fictional showcase. It is the studio's own storefront, and the user demanded it be far more animated and alive ("animations as good as aetheria", "live moving parts", "actually decent background instead of black"). So it follows showcase energy for motion, but real-business honesty for copy: no fake terminal aesthetics, no invented stats, real legal pages. Keep that split in mind.

**The user's verdict on the showcases:** Aetheria is the best of the three. A memory entry records that this validates the maximal-motion approach. When in doubt about ambition, aim for Aetheria's level.

---

## 10. The performance doctrine

The user said performance must be built into every step. Here is the doctrine the rebuild followed. Apply it to anything new.

1. **One loop** (GSAP ticker drives Lenis). No stray rAF loops.
2. **One WebGL context** on the real site; **at most one** on a phone on the showcases.
3. **Gate by device capability, not just width.** The real site's `lite` profile is true when: `prefers-reduced-motion`, viewport under 768px, coarse pointer with width up to 1024, 4 or fewer CPU cores, 4 GB or less device memory, `saveData`, or a slow connection (`slow-2g`, `2g`, `3g`). `lite` devices get a CSS-only background and never load embeds.
4. **Do not mount expensive things off-screen.** Iframes and WebGL mount when near/central and unmount when not (IntersectionObserver). The staircase on the real site keeps exactly one live iframe.
5. **Throttle the background while something heavy is live.** While an iframe embed is active, the shared canvas drops to `frameloop="demand"` and is pumped at about 30fps; when the tab is hidden it goes to `"never"`.
6. **Cap pixel ratio.** The shared canvas uses `dpr={[0.6, 0.9]}`. The background does not need full retina sharpness.
7. **No `background-attachment: fixed`.** It janks on mobile. The real site's `.sky` is a fixed-position element instead.
8. **`content-visibility: auto`** on heavy below-the-fold sections where safe.
9. **Reduced motion is respected.** A `prefers-reduced-motion` block flattens animation and transition durations.
10. **Hydration safety.** Anything that depends on the client (media queries, visibility, device profile) starts from a server-identical value and updates after mount, so server and first client render match.
11. **Do not measure by eye alone.** Count canvases (`document.querySelectorAll('canvas').length`), check horizontal overflow (`scrollWidth - innerWidth`), and read console errors. That is how the verification in this engagement was done.

---

## 11. The three portfolio sites in detail

All three: Next.js static export, every source file carries `// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.`, each has `src/lib/copyright.ts` exporting the marks used in UI.

### 11.1 Kroma Labs (`kroma-labs/`), port 3000

A fictional precision mechanical keyboard, the KL-75 "Monolith": machined 6063-T6 aluminium case, brass ballast, gasket-mounted FR4 plate, hot-swap PCB.

- Palette tokens include `carbon` (near-black), `signal` (burnt orange), `chalk`, `metric` (muted grey), `hairline`. Display font plus a mono font plus an editorial italic serif accent.
- Structure: `site-nav`, `hero`, `schematic` (a pinned, scroll-scrubbed exploded view), acoustics, specs, allocation.
- `hero.tsx`: kinetic headline, figures grid, and a WebGL keyboard on the right (`LazyKeyboardScene`).
- `schematic.tsx`: a `[100svh]` section pinned by GSAP for 260% of scroll; an `explodeStore` object is tweened 0 to 1 and back, exploding the 3D keyboard, while three callouts light up.
- **Mobile change this engagement:** menu button 36 to 44px. Both scenes now mount only when `>=1024px` or near the viewport (`use-near-view.ts`), so a phone runs one canvas at a time. Verified at 375px: one canvas, zero overflow, with a brief overlap of two during hand-off. Desktop (1440px) recount for Kroma was **not** done after this change.

### 11.2 Apex Dynamics (`apex-dynamics/`), port 3001

A fictional performance running shoe, "Prototype 04". Volt-yellow accent (`#ccff00`), `void` and `carbon` darks, `gridline` lines. Sections: telemetry, anatomy, wind tunnel, allocation.

- `site-nav.tsx`: auto-hiding bar, active-section observer, layout-animated underline, reading-progress thread, `liquid-gooey` mobile button.
- `wind-tunnel.tsx`: a drag-coefficient comparator with a speed toggle (`WIND_SPEEDS`), bars that animate on view, and a secondary WebGL airflow scene (`LazyStackScene`) driven by `airflowStore.value = speed / 25`.
- **Mobile change:** the wind-tunnel scene mounts only at `>=768px` (the hero already holds a canvas). Menu button and gooey layer 36 to 44px; droplet offset recomputed to `left/top 17px`. Verified: mobile 1 canvas, desktop 2, zero overflow, menu 44x44.

### 11.3 Aetheria Botanicals (`aetheria-botanicals/`), port 3002

A fictional slow-extraction botanical perfume atelier. Palette: linen, rosemary, terracotta, brass, sage, parchment. Fonts: Cormorant Garamond (display) plus Jost (sans). This is the user's favourite.

Sections (from the original brief): editorial hero with a WebGL flacon (perfume bottle); an **interactive compound blender** (choose botanicals, watch the tincture colour, a sensory radar and the flacon respond); a **terroir inspector** (herbarium plates and instruments for growing lots); an **extraction ritual** (desktop: pinned horizontal-scroll GSAP timeline; mobile/reduced-motion: tabbed stacked fallback); an **allocation drawer**; a monograph footer.

Notable files:
- `src/components/three/flacon-geometry.ts` and `flacon-scene.tsx`: a procedural fluted-crystal bottle from lathe geometry, glass/liquid/brass/stopper materials, custom mote and vapour shaders.
- `src/components/ritual/pinned-ritual.tsx` and `stacked-ritual.tsx`.
- `src/components/blender/flacon-arch.tsx`: the flacon in an arched niche.
- `src/lib/use-media.ts`: the SSR-safe media-query hook (Appendix A).
- Data modules: `blend-formulas.ts`, `terroir-lots.ts`, `ritual-phases.ts`, and stores `flacon-store.ts`, `allocation-store.ts`.

**Mobile change:** the arch's 3D flacon mounts only at `>=768px`; below that a CSS flacon takes the current tincture colour so the blend still visibly "answers". Verified: mobile 1 canvas, desktop 2, zero overflow.

**Clean-up history.** After Aetheria was "finished", a separate agent committed a lot of clutter (status-report `.md` files, a duplicate deploy workflow, `any`-typed regressions, unused imports). It was audited and removed; `README.md` was rewritten honestly. Lesson recorded in the studio memory: audit what other agents commit.

---

## 12. The main HVNF Studios site in detail

This is the studio's real storefront and the biggest piece of work this engagement. The user asked for a ground-up rebuild ("don't even improve it anymore just rethink everything"), so almost every file under `src/components/site/` is new.

### 12.1 Design system (`src/app/globals.css`)

Tailwind v4 native. `@import "tailwindcss"`, then an `@theme` with these colour tokens: `ink`, `carbon`, `graphite`, `slate-warm`, `rule`, `rule-strong`, `bone`, `ash`, `muted`, `ember`, `ember-deep`, `arc`; plus an `--ease-settle` curve `cubic-bezier(0.22, 1, 0.36, 1)`. Base rules for html/body/selection/focus-visible and headings live in `@layer base`; helper classes (`.sky`, `.shell`, `.eyebrow`, `.rule-draw`) live in `@layer components`. A `prefers-reduced-motion` block flattens motion.

**Critical rule:** keep all custom CSS inside `@layer`. Unlayered CSS beats layered CSS in Tailwind v4 regardless of order, and will silently override utilities. (This exact mistake was one of the two major bugs found, Section 13.)

### 12.2 `src/lib/perf.ts`

- `DeviceProfile = { lite: boolean }`, `measure()` implementing the rules in Section 10.3.
- `useDeviceProfile()`: starts `{ lite: true }` (safe), measures in an effect.
- `setHeavyActive(bool)` / `useHeavyActive()` / `isHeavyActive()`: a module-level counter plus listener set, consumed via `useSyncExternalStore`. Anything mounting an expensive embed calls `setHeavyActive(true)`; the background reacts.
- `usePageVisible()`: `document.visibilityState` as an external store.

### 12.3 `src/components/site/stage.tsx`: the shared canvas

One R3F `<Canvas>` with three layers: `Field` (a fullscreen quad with a 3-octave fbm noise colour field mixing `base/deep/arc/ember` with a diagonal sweep and vignette), `Terrain` (a wireframe `PlaneGeometry(16, 8, 120, 64)` that swells with the cursor and fades with scroll via `uPointer` and `uFade`), and `Motes` (drifting point sprites). `DemandPump` invalidates the canvas on a roughly 33 ms interval while a heavy embed is live. `Stage()` renders a plain `.sky` div for `lite` devices and the canvas inside `.sky` otherwise, with `frameloop` chosen from visibility and heavy-active state.

Things I tuned: the terrain first crossed the hero headline, so I reduced swell and ring amplitude, widened the edge fade and dropped base opacity (0.16 to 0.05). Its mesh sits at `position [0, -2.9, -1.2]`, `rotation [-1.16, 0, 0]`. And the precision bug: `TERRAIN_VERT` needed `precision mediump float;` to match `TERRAIN_FRAG`.

### 12.4 `src/components/site/kit.tsx`

Shared motion primitives: `SETTLE` easing `[0.22, 1, 0.36, 1]`, `Reveal`, `WordReveal` (masked word-by-word reveal; props `text`, `className`, `delay`, `stagger`, `immediate`), `RuleDraw`, `SectionHead` (index + eyebrow + rule), `Magnetic` (cursor-following spring button/link with hover sheen; `variant: "ember" | "ghost"`), `TiltCard` (perspective tilt).

### 12.5 Sections

- `nav.tsx`: solid sticky nav, hides on scroll down, scroll-progress thread, active-section observer, focus-trapped mobile sheet.
- `hero.tsx`: honest headline and copy (no invented claims), `WordReveal`, `Magnetic` CTAs, transparent so the Stage shows through.
- `work.tsx`: **the staircase.** `BUILDS` holds three entries (kroma, apex, aetheria) with `index/title/sector/blurb/built/href/poster/accent`. `Frame` renders an `<iframe>` at 1440x900 scaled by 0.3333 (so it is a live, real thumbnail of the deployed demo), mounted 300 ms after its step becomes the live one, calling `setHeavyActive`. `Step` adds GSAP parallax on non-first steps. `Work()` uses one IntersectionObserver to choose the most central step as `liveId`; `lite` devices never get an embed (poster only).
- `method.tsx`, `care.tsx`, `closing.tsx`: how the studio works, the ongoing care plan, and the closing call to action. Copy must stay free of invented prices and guarantees.
- `intake.tsx`: the project intake. Because this is a static export, it **composes a `mailto:` link** with a prefilled subject and body instead of pretending to POST. Confetti (dynamic import) fires only on a real send.
- `legal-page.tsx` plus `src/app/legal/terms/page.tsx` and `src/app/legal/privacy/page.tsx`: previously missing routes, now real pages.

`src/app/page.tsx` composes Stage, Nav, Hero, Work, Method, Care, Closing, Intake, sets up Lenis on GSAP's ticker, and cleans up properly. `src/app/layout.tsx` has honest metadata.

### 12.6 Why `mailto:`

A static export has no server. A form that appears to submit but goes nowhere is a lie to a prospective client. A `mailto:` is honest and works. If the studio later deploys to Vercel with server support, replace it with a real endpoint (for example a route handler plus an email service), and keep a `mailto:` fallback.

### 12.7 Stubbed old files

These are now `export {};` plus a one-line comment "replaced by X, safe to delete": `src/components/studio/hero.tsx`, `navbar.tsx`, `capabilities.tsx`, `footer.tsx`, `intake-drawer.tsx`, `flagship-grid.tsx`, `flagship-staircase.tsx` (an intermediate version), `living-backdrop.tsx` (an intermediate background). Deleting them is safe once you confirm nothing imports them.

---

## 13. The bug ledger

Every real problem found this engagement, with cause and fix. Use this as a pattern library.

1. **Dead Tailwind CSS on the real site.** `globals.css` used v3 `@tailwind base/components/utilities` under Tailwind v4, which ignores them. Zero utilities generated, so the page rendered as unstyled HTML. Fix: `@import "tailwindcss"` (later superseded by the rewritten file). Also the git log shows a PostCSS config fix for v4.
2. **The reset that ate all spacing.** A bare `* { margin:0; padding:0 }` outside any layer beats every layered utility in v4, so `px-8 py-4` measured `padding: 0`. Fix: put resets in `@layer base`.
3. **Nav overlap.** A status block centred with `absolute left-1/2` overlapped a nav link by about 80px at 1440. Fix: make it a flex sibling.
4. **Dead portfolio links.** Cards linked to `/kroma`, `/apex`, `/aetheria`, which do not exist. Fix: link to the real GitHub Pages URLs with `target="_blank" rel="noreferrer"` and a plain `<a>`.
5. **Duplicate stub intake drawer.** The navbar rendered its own placeholder ("Intake form content goes here") instead of the real four-step drawer. Fix: pass an open callback down. (Now moot after the rebuild.)
6. **GSAP temporal dead zone.** `onUpdate: () => markActive(travel.progress())` referenced `const travel` inside its own construction. Fix: `onUpdate(this: gsap.core.Tween) { markActive(this.progress()); }`.
7. **React 19 `react-hooks/immutability`.** Mutating props, memoized values or hook returns inside `useFrame` is flagged. Fix: keep mutable per-frame state in a `live` ref object populated in an effect; read a `sourceRef.current` updated by a separate effect instead of the prop.
8. **React 19 `react-hooks/set-state-in-effect`.** No synchronous `setState` in an effect body. Fix: `useSyncExternalStore` for media queries, visibility and heavy-active flags, or set state from an observer callback.
9. **Hydration mismatch from floating-point trig in SVG attributes.** Server and client printed different-precision decimals. Fix: wrap in `Math.round(x * 1000) / 1000`. Files: `terroir/instruments.tsx`, the ritual diagrams, `blender/sensory-radar.tsx`.
10. **Lenis rAF leak.** The original page ran a recursive `requestAnimationFrame` without storing or cancelling the id, so it kept ticking a destroyed Lenis. Fix: keep the id and `cancelAnimationFrame` on cleanup; better, drive Lenis from GSAP's ticker.
11. **Missing `#capabilities` anchor.** The header linked to an id that did not exist. Fix: add the id (solved cleanly in the rebuild's section scheme).
12. **Shader link failure.** Vertex and fragment precision mismatch on a shared uniform (Section 7). Fix: explicit matching precision.
13. **Background-agent clutter (process bug).** Another agent committed status-report markdown, a duplicate deploy workflow, and code regressions to Aetheria. Fix: audit and delete; rewrite the README truthfully.
14. **Workflow rate limits (process bug).** Background subagents hit session limits twice. The user then forbade workflows.
15. **Two WebGL contexts on phones (performance bug).** Each showcase had a hero canvas plus a second section canvas. Fixed as described in Section 11 with breakpoint gating (Apex, Aetheria) and near-view gating (Kroma).
16. **Sub-44px touch targets.** Mobile menu buttons were 36px on Kroma and Apex. Fixed to 44px.
17. **Kroma canvas not mounting under test.** `scrollIntoView` and `scrollTo` did not trigger the near-view gate under Lenis in the test harness; real wheel scrolling did. This was a testing artifact, not a product bug. When verifying, scroll with real input (the browser tool's scroll action).

---

## 14. Conventions

**Copyright header** on every file of the three portfolio sites (not on the real site):
```ts
// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.
```
For files with `"use client"`, the directive goes first, then a blank line, then the header.

**Commits.** Do not commit unless asked. New commits, not amends. Never skip hooks. Stage files by name. The current attribution line to end commit messages with is:
```
Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```
(Earlier commits in this engagement used `Claude Opus 5`; follow whatever attribution reminder is active in your session.) Do not push unless asked. Pull request bodies end with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

**Comments.** Default to none. Write one only when the *why* is non-obvious. No multi-paragraph docstrings.

**Files.** Prefer editing to creating. Do not create planning or report `.md` files unless asked.

**Lint style.** Match existing code: double quotes, trailing commas, two-space indent, `@/` import alias to `src/`.

**Naming.** Section components live in `components/sections/` on the demos and `components/site/` on the real site. Shared libs in `lib/`. Three.js code in `components/three/`.

---

## 15. Environment problems (the broken shell)

For the entire session that produced this handbook, both the Bash and PowerShell tools failed immediately with:

```
EPERM: operation not permitted, mkdir 'C:\Users\HoaVo\AppData\Local\Temp\claude\...'
```

The path is missing the space in "Hoa Vo" (the real user folder is `C:\Users\Hoa Vo`). I could read, write, edit, glob and grep, and I could drive the in-app browser pane (dev servers, screenshots, JavaScript inspection, console reads). I could **not** run `git`, `npm`, `tsc`, `eslint` or a production build.

Consequences: nothing from this engagement's last stretch is committed, nothing has been compiler-checked, and nothing has been production-built. First job for whoever inherits this, if the shell works for you, is Section 17.

The scratchpad path the harness reported has the same dropped-space problem. A fresh app or session restart may fix it; I could not confirm.

**About this file being "read-only".** The user asked for a permanent, non-editing file. I cannot set file attributes without a shell. To lock it once a shell works, run (PowerShell): `attrib +R "HVNF-HANDBOOK.md"`. On Git Bash: `chmod a-w HVNF-HANDBOOK.md`. Until then, this file's header is the only protection: do not edit it.

---

## 16. What is verified, what is not

**Verified visually in the in-app browser (dev servers):**
- Real site: Hero and Work at 1440 and 375. The shader precision error is gone (one occurrence before the fix, none after). Terrain toned down so it does not cross the headline.
- Apex: mobile 1 canvas, desktop 2, menu button 44x44, overflow 0.
- Aetheria: mobile 1 canvas, desktop 2, overflow 0.
- Kroma: menu button 44x44; mobile hero mounts one canvas when scrolled near; schematic mounts one on arrival; overlap of two during the brief hand-off then back to one; overflow 0.

**Not verified:**
- Any TypeScript compile, ESLint run or production build, on any site.
- Kroma at 1440px after the near-view change.
- Real site Method, Care, Closing, Intake at 375px.
- The full "mobile-friendly" audit of the three demos beyond canvas count and touch targets (type scaling, per-section overflow, other tap targets).
- Any git state. Commits and pushes: none made.
- That the three demo folders are submodules (assumed from a commit message).
- Real deploy of the rebuilt root site (no pipeline exists).
- Lighthouse or any numeric performance measurement. I have **no performance numbers**. Do not quote any.

---

## 17. How to pick the work back up, step by step

1. **Read** `CLAUDE.md`, then `HANDOFF.md`, then this file. Read memory notes if your environment loads them (they exist for the studio OS, tone, transitions, and "Aetheria best showcase").
2. **Check your shell.** Run a trivial command. If it fails with the `EPERM ... HoaVo` error, you have the same problem; keep working with file tools and the browser pane, and tell the user.
3. **Look before touching.** `git status`. Expect many modified and untracked files under `src/`, plus new files in each demo. Check whether the demos are submodules.
4. **Compile.** In the root and in each demo: `npx tsc --noEmit`, `npx eslint .`, `npm run build`. Expect a few real errors, since nothing was compiled. Likely places: the new `src/components/site/*`, `src/lib/perf.ts`, `stage.tsx` typings, and `use-near-view.ts` (its ref type is `RefObject<HTMLElement | null>`; passing a `RefObject<HTMLDivElement>` should be fine but check under strict React 19 types).
5. **Run and look.** Start the dev servers through the preview tool (ports in Section 5). Check each site at 375 and 1440. Count canvases. Read the console.
6. **Commit** in sensible chunks: one commit per site, root last. Do not push unless asked.
7. **Finish the mobile audit** (Section 18).
8. **Ask before** deploying, deleting stubs, or spending money.
9. **Write your own dated note**; do not edit this file.

### 17.1 A quick browser check recipe

Set a phone viewport (375x812), navigate to the dev server, wait a couple of seconds, then evaluate in the page:
```js
({ canvases: document.querySelectorAll('canvas').length,
   overflow: document.documentElement.scrollWidth - innerWidth })
```
Scroll with real wheel input (not `scrollIntoView`; Lenis and the near-view gate need real scroll). Reset the viewport to desktop when done.

---

## 18. Open tasks, ranked

1. Get a working shell, compile everything, fix errors, commit (Section 17).
2. Re-check Kroma at 1440px (both scenes still mount).
3. Finish the demo mobile audit: type scaling, per-section overflow, all touch targets under 44px, the pinned Kroma schematic on a short phone screen (its section is `100svh` and pinned for 260% of scroll, so check content does not clip), Aetheria's tabbed ritual, and Apex sections.
4. Verify the real site's Method, Care, Closing and Intake at 375px, then test the `mailto:` flow and the confetti-on-send behaviour.
5. Decide on a deploy target for the real site (Vercel is named in the studio plan; the demos use GitHub Pages) and set up the pipeline. Ask the user first.
6. Delete the stubbed `src/components/studio/*` files once nothing imports them.
7. Measure, do not guess: run Lighthouse or profile frames if the user wants numbers, and report only what you measured.
8. Consider a proper shared "device profile" gate in the demo sites too, matching the real site's `lite` logic (today they gate on breakpoint or visibility only).

---

## 19. Things I would do differently

- I built the near-view gating for Kroma only after gating the others by breakpoint. A single consistent pattern across all three would be cleaner. The breakpoint gate is simpler but removes the scene on phones; the near-view gate keeps it. For showcases, near-view is the better trade.
- I duplicated `use-media.ts` in three sites on purpose, but if the demos ever share a package, extract it.
- I could not run the compiler. Many of my edits are small, but "small" is not "checked".
- The `lite` profile treats any device with 4 or fewer cores as lite, which will classify some capable laptops as lite. That is deliberately conservative; tune it if the user wants the full experience on more machines.

---

## 20. Glossary

- **App Router.** Next.js's file-based routing under `src/app/`.
- **Static export.** Build to plain files; no server code.
- **Lenis.** Smooth-scroll library.
- **ScrollTrigger.** GSAP plugin linking animation to scroll; `pin` holds a section in place; `scrub` ties progress to scroll.
- **R3F.** React Three Fiber, React renderer for three.js.
- **Frameloop.** How often R3F redraws: always, on demand, or never.
- **Uniform.** A value passed from JS into a shader.
- **fbm.** Fractal Brownian motion, layered noise used for organic patterns.
- **Hydration.** React attaching to server-rendered HTML; mismatches cause warnings and glitches.
- **`useSyncExternalStore`.** React hook for reading outside state safely, with separate server and client snapshots.
- **Lite mode.** The real site's low-power path with no WebGL and no embeds.
- **Showcase / portfolio sample.** A fictional site built to demonstrate range.
- **Care Plan.** The studio's monthly retainer for hosting, uptime, SEO reporting and small updates.
- **DNS transfer.** Moving a client's domain to point at the new site; final payment is due before this.
- **Flacon.** French for a perfume bottle; the Aetheria hero object.
- **Tincture.** Aetheria's term for the blended liquid; its colour changes with the blend.

---

## 21. Appendix: reference snippets

### A. SSR-safe media query hook

```ts
"use client";
import { useSyncExternalStore } from "react";

export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
```
Server and first client render answer `false`, so markup matches; the real value lands on the next commit.

### B. Near-viewport gate

```ts
"use client";
import { useEffect, useState, type RefObject } from "react";

export function useNearView(ref: RefObject<HTMLElement | null>, rootMargin = "120px 0px"): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return near;
}
```
Usage: `const near = useNearView(stageRef); const wide = useMedia("(min-width: 1024px)"); {wide || near ? <Scene/> : null}`.

### C. Lenis on GSAP's single ticker

```ts
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
const tick = (t: number) => lenis.raf(t * 1000);
gsap.ticker.add(tick);
gsap.ticker.lagSmoothing(0);
// cleanup
gsap.ticker.remove(tick);
lenis.destroy();
```

### D. Safe GSAP onUpdate that reads its own tween

```ts
gsap.to(target, {
  x: 100,
  scrollTrigger: { /* ... */ },
  onUpdate(this: gsap.core.Tween) {
    markActive(this.progress());
  },
});
```

### E. Matching shader precision

```glsl
// vertex
precision mediump float;
uniform float uFade;
// fragment
precision mediump float;
uniform float uFade;
```

### F. Rounding trig for SVG to avoid hydration mismatch

```ts
const r3 = (n: number) => Math.round(n * 1000) / 1000;
<line x1={r3(cx + Math.cos(a) * r)} y1={r3(cy + Math.sin(a) * r)} /* ... */ />
```

### G. Tailwind v4 layering reminder

```css
@import "tailwindcss";

@layer base {
  /* resets, element defaults */
}
@layer components {
  /* .shell, .eyebrow, etc. */
}
/* NEVER leave plain rules outside a layer: they beat every utility. */
```

### H. `mailto:` composition sketch

```ts
const href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
window.location.href = href;
```
`TO` must be an address the user confirms; do not invent one.

### I. Verification one-liners

```js
document.querySelectorAll('canvas').length
document.documentElement.scrollWidth - innerWidth
[...document.querySelectorAll('button,a')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.width < 44 || r.height < 44); }).length
```
The last one lists undersized tap targets (inline links in body text will show up too; use judgement).

---

End of handbook. If something here disagrees with what you observe on disk, trust the disk and write a new note.
