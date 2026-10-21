"use client";

import {
  Component,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Vector2, WebGLRenderer } from "three";
import { Canvas, useStore, type RootState } from "@react-three/fiber";
import { gsap } from "@/lib/gsap";
import { bus } from "@/lib/bus";
import { ISO_PITCH, ISO_YAW } from "./cube-3d";
import { useHeavyActive } from "@/lib/perf";
import { BOX_LATTICE, POSE, POSE_SIZE, createDirector } from "./cube-director";
import { createCubeScene, type CubeScene } from "./cube-shader";

/**
 * The stage: every pixel of WebGL on this site, in one context. It draws one
 * thing, the HVNF cube, with one orthographic camera whose world units are CSS
 * px, so the cube can sit exactly on top of a DOM slot.
 *
 * Performance contract:
 *  - lite devices (phones, ≤4 cores, low memory, data-saver, reduced motion)
 *    never mount it; page.tsx skips this whole chunk and the slots show SVG.
 *  - frameloop "never": R3F runs no rAF of its own. One gsap.ticker callback
 *    (after Lenis, ScrollTrigger and gsap's tweens) builds a 20-float pose and
 *    renders only when that pose changed, so a still page costs 0 frames:
 *    the idle hero, the Work pin, the covered Care section, an open intake, a
 *    hidden tab.
 *  - two draw calls a frame (42 instanced beams, 800 points), no depth, no
 *    post. When the cube is fully transparent the wrapper is visibility:hidden
 *    and the compositor stops blending a full-screen layer.
 *  - resolution is measured, not assumed: DPR tiers under a pixel budget, and
 *    AutoQuality trims a tier when rendered frames miss the budget. While a
 *    live site embed runs, DPR is held at ≤1 and nothing is sampled.
 *  - no scroll listener: scroll arrives through bus.scrollY, written by Lenis.
 */

declare global {
  interface Window {
    /** Dev builds only: rendered Stage frames, for the "0 frames when idle" check. */
    __stageFrames?: number;
  }
}

/** Resolution tiers. Fragment cost scales with the square, so each step is real. */
const TIERS = [0.75, 1, 1.25, 1.5] as const;
const START_TIER = 1;
/** Device pixels the canvas may cover: 2560×1440 caps near 1.1, a 1440×900 laptop at 1.86. */
const PIXEL_BUDGET = 4.5e6;

/** 13.9ms: a frame here leaves room for the page's own work and still clears 72fps. */
const BUDGET_MS = 1000 / 72;
/** 9.1ms: comfortably inside a 110fps pace, so there is room to spend again. */
const HEADROOM_MS = 1000 / 110;
const WINDOW = 60;
const WARMUP = 45;
const MAX_MOVES = 4;

/** A pose entry moving less than this is the same frame. */
const EPSILON = 1e-4;
/** Below this alpha the cube (and its dust, which scales with it) is invisible. */
const INVISIBLE = 0.002;

const CAMERA = { position: [0, 0, 1000] as [number, number, number], zoom: 1, near: 0.1, far: 4000 };
// React-use-measure's default also listens to window scroll and reads layout on
// it. A fixed, full-screen canvas never moves on scroll, so only resizes count.
const RESIZE = { scroll: false };
// Canvas sets pointer-events:auto on its own div; nothing here is interactive.
const NO_EVENTS = { pointerEvents: "none" } as const;

type StageValue = "live" | "failed";

/** html[data-stage] drives the slots' SVG fallback (cube-mark.module.css). Written only on change. */
function setStage(value: StageValue | null) {
  const root = document.documentElement;
  if (value === null) delete root.dataset.stage;
  else if (root.dataset.stage !== value) root.dataset.stage = value;
}

/** R3F rethrows anything inside the Canvas into this tree; it must never take the page down. */
class Boundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** The DPR ceiling: the screen's own ratio, or the pixel budget, whichever is lower. */
function readCap() {
  const pixels = Math.max(1, window.innerWidth * window.innerHeight);
  const cap = Math.min(window.devicePixelRatio || 1, Math.sqrt(PIXEL_BUDGET / pixels));
  // Stepped, so dragging a window edge does not re-render the canvas per pixel.
  return Math.floor(cap * 20) / 20;
}

function usePixelCap() {
  const [cap, setCap] = useState(readCap);
  useEffect(() => {
    let media: MediaQueryList | null = null;
    // A window moved to a screen with another pixel ratio fires no resize, so
    // listen for that ratio to stop matching instead.
    const update = () => {
      setCap(readCap());
      media?.removeEventListener("change", update);
      media = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      media.addEventListener("change", update);
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      media?.removeEventListener("change", update);
    };
  }, []);
  return cap;
}

type Quality = { heavy: boolean; tier: number; cap: number };

function apply(scene: CubeScene, pose: Float64Array, width: number, height: number) {
  const u = scene.uniforms;
  const box = pose[POSE.box];
  const yaw = pose[POSE.yaw];
  const pitch = pose[POSE.pitch];
  const scatter = pose[POSE.scatter];
  const explode = pose[POSE.explode];
  const dissolve = pose[POSE.dissolve];
  const burst = pose[POSE.burst];

  // World units are CSS px with the origin at the canvas centre, y up.
  scene.root.position.set(pose[POSE.x] - width / 2, height / 2 - pose[POSE.y], 0);
  scene.root.rotation.set(ISO_PITCH + pitch, ISO_YAW + yaw, 0, "XYZ");
  scene.root.scale.setScalar(box / BOX_LATTICE);

  u.uBox.value = box;
  u.uScatter.value = scatter;
  u.uJitter.value = pose[POSE.jitter];
  u.uExplode.value = explode;
  u.uDraw.value = pose[POSE.draw];
  u.uDissolve.value = dissolve;
  u.uParadox.value = pose[POSE.paradox];
  u.uParadoxEmber.value = pose[POSE.ember];
  u.uTint.value = pose[POSE.tint];
  u.uRedline.value = pose[POSE.redline];
  u.uGlow.value = pose[POSE.glow];
  u.uWidthScale.value = pose[POSE.widthScale];
  u.uGuides.value = pose[POSE.guides];
  u.uAlpha.value = pose[POSE.alpha];
  u.uFlash.value = pose[POSE.flash];
  u.uBurst.value = burst;

  // Scatter is invisible at the true angle, so it only detaches the cube once
  // the camera has left it. Dust exists only while something is detached.
  const offAxis = Math.min(1, Math.hypot(yaw, pitch) / 0.3);
  const loose = Math.max(scatter * offAxis, explode);
  u.uDetach.value = loose;
  scene.dust.visible = Math.max(loose, dissolve, burst) > INVISIBLE;
}

type CubeProps = {
  wrapper: RefObject<HTMLDivElement | null>;
  quality: Quality;
  onTier: (tier: number) => void;
  onFail: () => void;
};

/** Lives inside the Canvas: owns the scene, the director and the one ticker callback. */
function Cube({ wrapper, quality, onTier, onFail }: CubeProps) {
  const store = useStore();
  const scene = useMemo(createCubeScene, []);

  // The ticker reads the latest quality inputs without being re-registered.
  const latest = useRef(quality);
  useLayoutEffect(() => {
    latest.current = quality;
  }, [quality]);

  useEffect(() => () => scene.dispose(), [scene]);

  useEffect(() => {
    const director = createDirector();
    const pose = new Float64Array(POSE_SIZE);
    const shown = new Float64Array(POSE_SIZE).fill(Number.NaN);
    const buffer = new Vector2();
    const { gl, scene: world, camera } = store.getState();
    const canvas = gl.domElement;

    let alive = true;
    let ready = false;
    let first = true;
    let force = true;
    let visible = true;
    let width = 0;
    let height = 0;
    let ratio = 0;
    let lastRendered = -2;
    const samples: number[] = [];
    let warmup = 0;
    let moves = 0;

    // Compile off the main thread where the driver allows it, so the first
    // frame never stalls on a shader link.
    gl.compileAsync(world, camera).then(
      () => {
        if (alive) ready = true;
      },
      () => {
        if (alive) onFail();
      },
    );

    // three prevents the default on loss, so the browser may hand the context
    // back; until then the SVG fallback stands in.
    const onLost = () => {
      ready = false;
      setStage("failed");
    };
    const onRestored = () => {
      ready = true;
      first = true;
      force = true;
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    const setVisible = (next: boolean) => {
      if (next === visible) return;
      visible = next;
      const el = wrapper.current;
      if (el) el.style.visibility = next ? "" : "hidden";
    };

    const sampleQuality = (deltaMs: number) => {
      const { tier, cap } = latest.current;
      if (warmup < WARMUP) {
        warmup += 1;
        return;
      }
      if (moves >= MAX_MOVES) return;
      samples.push(deltaMs);
      if (samples.length < WINDOW) return;

      samples.sort((a, b) => a - b);
      const median = samples[WINDOW / 2];
      // The display's own pace: a 60Hz screen can never beat 16.7ms, so the
      // 72fps budget is measured against what the screen can actually show.
      const pace = samples[WINDOW / 4];
      samples.length = 0;

      const effective = Math.min(TIERS[tier], cap);
      if (median > Math.max(BUDGET_MS, pace * 1.25)) {
        let next = tier - 1;
        while (next >= 0 && Math.min(TIERS[next], cap) >= effective) next -= 1;
        if (next >= 0) {
          moves += 1;
          onTier(next);
        }
      } else if (median < HEADROOM_MS && tier < TIERS.length - 1 && TIERS[tier] < cap) {
        moves += 1;
        onTier(tier + 1);
      }
    };

    const tick = (time: number, deltaMs: number, frame: number) => {
      if (!ready || bus.paused || document.hidden) return;
      const state: RootState = store.getState();
      const { size } = state;
      if (size.width < 1 || size.height < 1) return;

      // A resize or DPR change reallocates (and clears) the drawing buffer.
      const nextRatio = state.gl.getPixelRatio();
      if (size.width !== width || size.height !== height || nextRatio !== ratio) {
        width = size.width;
        height = size.height;
        ratio = nextRatio;
        state.gl.getDrawingBufferSize(buffer);
        scene.uniforms.uViewport.value.copy(buffer);
        scene.uniforms.uDpr.value = buffer.x / width;
        force = true;
      }

      if (first) director.begin();
      director.frame(bus.scrollY, deltaMs / 1000, width, height, pose);

      const show = pose[POSE.alpha] > INVISIBLE;
      // Nothing to see: hide the layer and draw nothing. The first frame still
      // renders, so shaders are warm and the slots learn the Stage is live.
      if (!show && !first) {
        setVisible(false);
        return;
      }

      let changed = force;
      for (let i = 0; !changed && i < POSE_SIZE; i++) changed = Math.abs(pose[i] - shown[i]) > EPSILON;
      if (!changed) {
        setVisible(show);
        return;
      }

      try {
        apply(scene, pose, width, height);
        state.advance(time);
      } catch {
        onFail();
        return;
      }
      shown.set(pose);
      force = false;
      setVisible(show);

      if (first) {
        first = false;
        setStage("live");
      }
      if (process.env.NODE_ENV !== "production") window.__stageFrames = (window.__stageFrames ?? 0) + 1;

      // Only back-to-back rendered frames say anything about the GPU: a gap
      // means the Stage slept, not that a frame was slow.
      if (latest.current.heavy) {
        samples.length = 0;
      } else if (lastRendered === frame - 1) {
        sampleQuality(deltaMs);
      }
      lastRendered = frame;
    };

    // Default (not prioritized) add: Lenis and ScrollTrigger have already run
    // this tick, then gsap's own tweens, then this.
    gsap.ticker.add(tick);
    return () => {
      alive = false;
      gsap.ticker.remove(tick);
      director.destroy();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      const el = wrapper.current;
      if (el) el.style.visibility = "";
    };
  }, [store, scene, wrapper, onTier, onFail]);

  return <primitive object={scene.root} />;
}

export function Stage() {
  const heavy = useHeavyActive();
  const cap = usePixelCap();
  const [tier, setTier] = useState(START_TIER);
  const [failed, setFailed] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  const fail = useCallback(() => {
    setStage("failed");
    setFailed(true);
  }, []);

  // The cursor in -1..1 across the viewport, y down. Mouse and pen only: a
  // finger on glass is scrolling, not aiming.
  useEffect(() => {
    let w = window.innerWidth;
    let h = window.innerHeight;
    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      bus.pointerX = (event.clientX / w) * 2 - 1;
      bus.pointerY = (event.clientY / h) * 2 - 1;
    };
    // Leaving the window lets the cube ease back onto the true angle.
    const onLeave = () => {
      bus.pointerX = 0;
      bus.pointerY = 0;
    };
    const root = document.documentElement;
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      onLeave();
      // A Stage that leaves (a resize into lite) hands the slots back to the
      // SVG. A failure stays recorded.
      if (root.dataset.stage === "live") setStage(null);
    };
  }, []);

  // A context that cannot be created throws inside R3F's async setup, where no
  // error boundary sees it. Catch it here, mark the page, and never resolve, so
  // R3F stops quietly instead of retrying with its own defaults.
  const createRenderer = useCallback(
    async ({ canvas }: { canvas: EventTarget }) => {
      try {
        return new WebGLRenderer({
          canvas: canvas as HTMLCanvasElement,
          antialias: false,
          alpha: true,
          depth: false,
          stencil: false,
          powerPreference: "low-power",
        });
      } catch {
        fail();
        return new Promise<WebGLRenderer>(() => {});
      }
    },
    [fail],
  );

  // Shader compile or link errors: show the SVG rather than an empty slot.
  const onCreated = useCallback(
    ({ gl }: RootState) => {
      gl.debug.onShaderError = (context, program) => {
        if (process.env.NODE_ENV !== "production") console.error("[stage] shader error", context.getProgramInfoLog(program));
        fail();
      };
    },
    [fail],
  );

  const quality = useMemo<Quality>(() => ({ heavy, tier, cap }), [heavy, tier, cap]);

  if (failed) return null;

  // A live embed owns the GPU budget: hold DPR at ≤1 until it leaves.
  const dpr = Math.min(TIERS[tier], cap, heavy ? 1 : Number.POSITIVE_INFINITY);

  return (
    <div ref={wrapper} aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <Boundary onError={fail}>
        <Canvas
          orthographic
          frameloop="never"
          dpr={dpr}
          camera={CAMERA}
          gl={createRenderer}
          resize={RESIZE}
          style={NO_EVENTS}
          onCreated={onCreated}
          fallback={null}
        >
          <Cube wrapper={wrapper} quality={quality} onTier={setTier} onFail={fail} />
        </Canvas>
      </Boundary>
    </div>
  );
}
