"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useHeavyActive, usePageVisible } from "@/lib/perf";

/**
 * The stage: every pixel of WebGL on this site, in one context.
 *
 * Three layers share it — a drifting colour field, a mote field, and the wire
 * terrain that answers the cursor in the hero. Keeping them in one canvas means
 * one GL context, one render loop and one resize path for the whole page.
 *
 * Performance contract:
 *  - lite devices (phones, ≤4 cores, low memory, data-saver, reduced motion) never
 *    mount it at all; page.tsx keeps the .sky gradient and skips this module.
 *  - resolution is measured, not assumed: AutoQuality samples frame time and trims
 *    DPR until the page holds its budget, so a weak GPU loses sharpness in a
 *    background image rather than frames everywhere.
 *  - the terrain stops drawing once the hero scrolls away, which is most of the page.
 *  - frameloop stops when the tab is hidden, and drops to ~30fps while a live site
 *    embed is on screen, so two heavy contexts never fight for the GPU.
 *  - scroll position is read from a passive listener into a ref, never from layout
 *    inside the frame loop.
 */

const FIELD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Three octaves: at full-screen this is fill-rate bound and more detail is invisible.
const FIELD_FRAG = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uAspect;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  // Two octaves for the warp layer. It only feeds high smoothstep thresholds,
  // where the third octave is curved away before it reaches the screen — so that
  // octave was four hash lookups per pixel spent on nothing.
  float fbm2(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 2; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5) + uPointer * 0.05;

    float t = uTime * 0.018;
    float n1 = fbm(p * 1.5 + vec2(t, t * 0.6));
    float n2 = fbm2(p * 2.6 - vec2(t * 0.8, t * 1.2) + n1);

    vec3 base   = vec3(0.027, 0.035, 0.055);
    vec3 deep   = vec3(0.043, 0.098, 0.118);
    vec3 arc    = vec3(0.129, 0.325, 0.310);
    vec3 ember  = vec3(0.357, 0.208, 0.114);

    vec3 col = base;
    col = mix(col, deep, smoothstep(0.25, 0.95, n1));
    col = mix(col, arc, smoothstep(0.55, 1.05, n2) * 0.55);
    col = mix(col, ember, smoothstep(0.62, 1.10, n1 * n2 * 2.0) * 0.45);

    // A slow beam crossing the room, so the surface is never completely static.
    // Cubed by multiplication: pow() is a log2/exp2 pair on most hardware, and
    // this runs on every pixel of a full-screen quad.
    float sweep = sin((uv.x * 0.8 + uv.y) * 1.4 - uTime * 0.07) * 0.5 + 0.5;
    col += sweep * sweep * sweep * 0.045;

    // Gentle vignette — enough to seat the type, not enough to crush the colour.
    float d = length(vec2((uv.x - 0.5) * uAspect, uv.y - 0.5));
    col *= 1.0 - smoothstep(0.5, 1.35, d) * 0.45;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const TERRAIN_VERT = /* glsl */ `
  // Must match the fragment stage: a uniform declared in both with different
  // precision fails link validation ("precisions of uniform differ").
  precision mediump float;
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uFade;
  varying float vRipple;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;

    // Long swell across the sheet.
    float swell = sin(p.x * 0.5 + uTime * 0.3) * cos(p.y * 0.36 - uTime * 0.24) * 0.22;

    // The cursor pushes a soft ring outward. Wide falloff and low amplitude keep it
    // a swell rather than a spike.
    float d = distance(p.xy, uPointer * vec2(6.0, 3.0));
    float ring = sin(d * 1.5 - uTime * 1.8) * exp(-d * 0.42) * 0.42;

    float lift = (swell + ring) * uFade;
    p.z += lift;

    vRipple = lift;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const TERRAIN_FRAG = /* glsl */ `
  precision mediump float;
  varying float vRipple;
  varying vec2 vUv;
  uniform float uFade;

  void main() {
    // Ember where the sheet rises toward you, arc where it falls away.
    vec3 high = vec3(0.914, 0.647, 0.408);
    vec3 low  = vec3(0.318, 0.600, 0.573);
    float t = clamp(vRipple * 0.6 + 0.5, 0.0, 1.0);
    vec3 col = mix(low, high, t);

    // Fade the sheet out at its edges so it has no visible border, and dissolve it
    // toward the horizon so it reads as distance rather than a grid pinned to glass.
    float edge = smoothstep(0.0, 0.22, vUv.x) * (1.0 - smoothstep(0.78, 1.0, vUv.x))
               * smoothstep(0.0, 0.26, vUv.y) * (1.0 - smoothstep(0.62, 1.0, vUv.y));

    float strength = (0.05 + abs(vRipple) * 0.34) * edge * uFade;
    gl_FragColor = vec4(col, strength);
  }
`;

const MOTE_VERT = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uPointer;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.y = mod(p.y + uTime * (0.03 + aSeed * 0.04) + 7.0, 14.0) - 7.0;
    p.x += sin(uTime * 0.16 + aSeed * 30.0) * 0.45 + uPointer.x * (0.15 + aSeed * 0.35);
    p.y += uPointer.y * (0.08 + aSeed * 0.15);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (150.0 / -mv.z);
    vAlpha = (0.2 + 0.5 * fract(aSeed * 9.71)) * (0.55 + 0.45 * sin(uTime * 0.6 + aSeed * 40.0));
  }
`;

const MOTE_FRAG = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = 1.0 - smoothstep(0.0, 0.5, d);
    gl_FragColor = vec4(vec3(0.77, 0.85, 0.82), a * a * vAlpha * 0.45);
  }
`;

type Pointer = { x: number; y: number };

function Field({ pointer }: { pointer: React.RefObject<Pointer> }) {
  const { viewport, size } = useThree();
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FIELD_VERT,
        fragmentShader: FIELD_FRAG,
        uniforms: { uTime: { value: 0 }, uPointer: { value: new THREE.Vector2() }, uAspect: { value: 1 } },
        depthWrite: false,
      }),
    [],
  );

  const live = useRef<THREE.ShaderMaterial | null>(null);
  useEffect(() => {
    live.current = material;
    return () => {
      live.current = null;
      material.dispose();
    };
  }, [material]);

  useFrame((_, delta) => {
    const m = live.current;
    if (!m) return;
    m.uniforms.uTime.value += Math.min(delta, 1 / 20);
    m.uniforms.uAspect.value = size.width / Math.max(1, size.height);
    const target = m.uniforms.uPointer.value as THREE.Vector2;
    target.x += (pointer.current.x - target.x) * 0.03;
    target.y += (pointer.current.y - target.y) * 0.03;
  });

  return (
    <mesh material={material} position={[0, 0, -6]} scale={[viewport.width * 2.4, viewport.height * 2.4, 1]}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

function Terrain({ pointer, heroFade }: { pointer: React.RefObject<Pointer>; heroFade: React.RefObject<number> }) {
  // 96 × 48. Wireframe is the expensive part, not the vertices: the renderer draws
  // three edges per triangle, so this sheet is ~28k line segments a frame. Finer
  // than this and the extra lines land inside a pixel of each other anyway.
  const geometry = useMemo(() => new THREE.PlaneGeometry(16, 8, 96, 48), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: TERRAIN_VERT,
        fragmentShader: TERRAIN_FRAG,
        uniforms: { uTime: { value: 0 }, uPointer: { value: new THREE.Vector2() }, uFade: { value: 1 } },
        transparent: true,
        depthWrite: false,
        wireframe: true,
      }),
    [],
  );

  const live = useRef<THREE.ShaderMaterial | null>(null);
  const mesh = useRef<THREE.Mesh>(null);
  useEffect(() => {
    live.current = material;
    return () => {
      live.current = null;
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, delta) => {
    const m = live.current;
    if (!m) return;
    const fade = m.uniforms.uFade.value as number;

    // Below this the sheet is invisible, and the rest of the page is spent there.
    // Skipping the draw is worth more than any shader tuning inside it.
    const shown = fade > 0.015;
    if (mesh.current) mesh.current.visible = shown;
    if (!shown && heroFade.current < 0.015) return;

    m.uniforms.uTime.value += Math.min(delta, 1 / 20);
    const p = m.uniforms.uPointer.value as THREE.Vector2;
    p.x += (pointer.current.x - p.x) * 0.06;
    p.y += (pointer.current.y - p.y) * 0.06;
    // Fades out as the hero leaves, so it never animates under the rest of the page.
    m.uniforms.uFade.value = fade + (heroFade.current - fade) * 0.08;
  });

  // Seated low and raked away, so the copy sits above the horizon rather than in the mesh.
  return <mesh ref={mesh} geometry={geometry} material={material} position={[0, -2.9, -1.2]} rotation={[-1.16, 0, 0]} />;
}

function Motes({ pointer, count }: { pointer: React.RefObject<Pointer>; count: number }) {
  const dpr = useThree((s) => s.viewport.dpr);

  const { geometry, material } = useMemo(() => {
    // Deterministic: identical field on server and client, no hydration surprises.
    let seed = 0x5f3a19;
    const rand = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return ((seed >>> 0) % 100000) / 100000;
    };
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions.set([(rand() - 0.5) * 24, (rand() - 0.5) * 14, -1 - rand() * 5], i * 3);
      seeds[i] = rand();
      sizes[i] = 0.6 + rand() * 1.6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: MOTE_VERT,
      fragmentShader: MOTE_FRAG,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uPointer: { value: new THREE.Vector2() } },
      transparent: true,
      depthWrite: false,
    });
    return { geometry: g, material: m };
  }, [count]);

  const live = useRef<THREE.ShaderMaterial | null>(null);
  useEffect(() => {
    live.current = material;
    return () => {
      live.current = null;
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, delta) => {
    const m = live.current;
    if (!m) return;
    m.uniforms.uTime.value += Math.min(delta, 1 / 20);
    m.uniforms.uPixelRatio.value = dpr;
    const p = m.uniforms.uPointer.value as THREE.Vector2;
    p.x += (pointer.current.x - p.x) * 0.02;
    p.y += (pointer.current.y - p.y) * 0.02;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

/** While an embed is live the canvas renders on demand, pumped at ~30fps. */
function DemandPump({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => invalidate(), 33);
    return () => window.clearInterval(id);
  }, [active, invalidate]);
  return null;
}

/**
 * Resolution tiers, coarsest first. Fragment cost scales with the square of this
 * number, so 0.9 → 0.65 is roughly half the shading work for a background whose
 * whole job is to be soft.
 */
const DPR_TIERS = [0.5, 0.65, 0.8, 0.9] as const;

/** 13.9ms — a frame here leaves room for the page's own work and still clears 72fps. */
const BUDGET_MS = 1000 / 72;
/** 9.1ms — comfortably inside a 110fps pace, so there is room to spend again. */
const HEADROOM_MS = 1000 / 110;

/**
 * Holds the frame budget instead of hoping one fixed resolution suits every GPU.
 *
 * Samples frame time in windows of 60 and moves a tier when the median misses the
 * budget, climbing back if the machine turns out to have headroom. Capped at a few
 * moves so it settles rather than hunting between two tiers forever.
 */
function AutoQuality({ active, tier, onTier }: { active: boolean; tier: number; onTier: (tier: number) => void }) {
  const frames = useRef<number[]>([]);
  const warmup = useRef(0);
  const moves = useRef(0);

  useFrame((_, delta) => {
    // A throttled embed loop and start-up jank are not signal about the GPU.
    if (!active) {
      frames.current.length = 0;
      return;
    }
    if (warmup.current < 45) {
      warmup.current += 1;
      return;
    }
    if (moves.current >= 4) return;

    const samples = frames.current;
    samples.push(delta * 1000);
    if (samples.length < 60) return;

    samples.sort((a, b) => a - b);
    const median = samples[30];
    frames.current = [];

    if (median > BUDGET_MS && tier > 0) {
      moves.current += 1;
      onTier(tier - 1);
    } else if (median < HEADROOM_MS && tier < DPR_TIERS.length - 1) {
      moves.current += 1;
      onTier(tier + 1);
    }
  });

  return null;
}

export function Stage() {
  const visible = usePageVisible();
  const heavy = useHeavyActive();
  // Starts one step below the ceiling: a common machine holds this immediately,
  // and AutoQuality moves either way from here within about a second.
  const [tier, setTier] = useState(2);
  const pointer = useRef<Pointer>({ x: 0, y: 0 });
  const heroFade = useRef(1);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };

    // Passive listener → ref. The frame loop never touches layout to learn this.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const past = window.scrollY / Math.max(1, window.innerHeight);
        heroFade.current = Math.max(0, 1 - past * 1.4);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Transparent: page.tsx already paints .sky behind this, and stacking a second
  // full-screen gradient on top of it is a wasted paint of the whole viewport.
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <Canvas
        dpr={DPR_TIERS[tier]}
        frameloop={!visible ? "never" : heavy ? "demand" : "always"}
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power", depth: false, stencil: false }}
      >
        <AutoQuality active={visible && !heavy} tier={tier} onTier={setTier} />
        <DemandPump active={visible && heavy} />
        <Field pointer={pointer} />
        <Terrain pointer={pointer} heroFade={heroFade} />
        <Motes pointer={pointer} count={260} />
      </Canvas>
    </div>
  );
}
