# HVNF Studios: agent handoff

Last updated 2026-09-20. Read this first. Long background: `HVNF-HANDBOOK.md` (frozen snapshot, do not edit; its shell/git notes are out of date, this file wins). Delete this file when the open items are done.

## State

- **Shell works again.** The old EPERM was a stray `C:\Users\HoaVo` folder the app used for temp files and could not write to. Fixed by creating `C:\Users\HoaVo\AppData\Local\Temp\claude` and granting the user access (admin `icacls`). If it comes back, that folder is the place to look.
- **Verified 2026-09-20:** `tsc --noEmit` clean and `npm run build` passes in the root, `kroma-labs`, `apex-dynamics` and `aetheria-botanicals`. ESLint is clean in the three demos. The root has **no ESLint config or dependency** (nothing to lint yet; do not let `npx eslint` auto-install one).
- **Repos:** the three demos are git submodules (`.gitmodules` points at `github.com/RedSn0w1877/<name>`), all on branch `improve/site-polish`. Commit inside each demo first, then commit the updated pointers in the root. **Nothing has been pushed.**
- Preview servers: kroma 3000, apex 3001, aetheria 3002, root 3003 (`.claude/launch.json`).

## Open items

1. Push the demo branches and the root only when the user asks. The demos deploy to GitHub Pages (`redsn0w1877.github.io/<repo>/`); the root site has no deploy pipeline yet (studio plan names Vercel). Ask before deploying.
2. Kroma and Apex heroes and 3D scenes were blank in a hidden browser pane (hidden tabs pause animation), so their WebGL draw and intro animations were **not** visually confirmed this round. Recheck with the Browser pane open.
3. Apex: the telemetry marker pulse now animates `scale` instead of `r` (motion wrote `r="undefined"`). Confirm the console stays clean and the pulse looks right.
4. Finish the mobile audit at 375px on the demos (type scaling, per-section overflow, remaining tap targets under 44px, Kroma's pinned schematic on a short screen, Aetheria's tabbed ritual) and the root's Method, Care, Closing and Intake.
5. `studio@hvnf.dev` appears in the root site's closing section. Confirm it is a real inbox with the user, or replace it.
6. The root site has no ESLint. Add it only if the user wants it, and give them the install command rather than running it.

## Rules from the user (still in force)

- **No Workflow tool, no subagent fan-outs.** The user is on usage credits ("dont burn my credits"). Work directly.
- Build each portfolio site fresh; do not copy components between them (tiny shared utilities like `use-media.ts` are intentionally duplicated).
- Do not install npm packages yourself; give the user the exact command.
- Never fabricate testimonials, certifications, uptime or performance numbers. No performance figures exist; measure before quoting.
- Every file in the three portfolio sites carries `// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.` The real business site does not.
- Chill, casual, teaching tone (see `CLAUDE.md`). Next.js here is a newer version; read `node_modules/next/dist/docs/` before framework code.

## React 19 lint gotchas

- No `setState` synchronously in an effect body; use `useSyncExternalStore` or set state from an observer callback.
- Do not mutate props or hook return values inside `useFrame`; copy into a local ref first.
- Round trig results before putting them in SVG attributes, or server and client print different decimals and hydration mismatches.
- Do not animate an SVG attribute with no base value (motion writes `undefined`); animate `scale` or `opacity` instead.
