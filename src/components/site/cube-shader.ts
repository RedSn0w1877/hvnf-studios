import {
  AddEquation,
  BufferGeometry,
  CustomBlending,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  OneFactor,
  OneMinusSrcAlphaFactor,
  Points,
  ShaderMaterial,
  Vector2,
} from "three";
import { GROUP, SEGMENTS_3D as SEGMENTS, local } from "./cube-3d";

/**
 * The cube's GPU side: every beam in one instanced draw call, plus one Points
 * call for the dust that comes off the beams when the cube is pulled apart.
 *
 * Lines are not GL_LINES. Those are 1px on most drivers, unsmoothed, and cannot
 * carry a halo, so each beam is a quad built in screen space: both endpoints are
 * projected, the quad is extruded across the projected line in device pixels,
 * and the fragment shader draws an analytic anti-aliased core plus a Gaussian
 * halo from the distance to the line. That keeps strokes the same pixel weight
 * at every box size and every DPR tier, which is what lets the WebGL mark sit
 * on top of the SVG fallback without a visible handover.
 *
 * Written in GLSL ES 1.0 style (attribute / varying / gl_FragColor). three's
 * ShaderMaterial prefix maps that onto GLSL ES 3.00 for WebGL2, and nothing
 * here needs more than 8 vertex attributes (the WebGL1-class floor), so the
 * shader holds on the weakest GPUs that still get a Stage at all.
 *
 * Colours are sRGB constants with no colorspace include, so they land on screen
 * as exactly the CSS tokens: line #e6edf1, draft #6fb0cc, ember #e9a568.
 */

/** 39 lattice segments plus the three construction guides. */
export const BEAM_COUNT = SEGMENTS.length + 3;
const DUST_COUNT = 800;
/** Guides run ±40 lattice units along each iso axis: far past the screen edge at any box. */
const GUIDE_REACH = 40;

const COMMON = /* glsl */ `
  const vec3 VIEW = vec3(0.5773503);
  const vec3 LINE = vec3(0.902, 0.929, 0.945);
  const vec3 DRAFT = vec3(0.435, 0.690, 0.800);
  const vec3 EMBER = vec3(0.914, 0.647, 0.408);

  uniform float uDpr;
  uniform float uScatter;
  uniform float uJitter;
  uniform float uExplode;
  uniform float uDissolve;
  uniform float uTint;
  uniform float uAlpha;

  // Scatter slides a segment along the view axis, so at the true angle it moves
  // and nothing on screen changes; jitter is the intro's tumble, settling in
  // draw order so the outline locks first.
  vec3 cubeOffset(float depth, vec3 jitter, float order) {
    return VIEW * depth * 12.0 * uScatter
      + jitter * 3.0 * uJitter * (1.0 - smoothstep(order - 0.2, order, 1.0 - uJitter));
  }
`;

const BEAM_VERT = /* glsl */ `
  ${COMMON}
  uniform vec2 uViewport;
  uniform float uBox;
  uniform float uDraw;
  uniform float uParadox;
  uniform float uParadoxEmber;
  uniform float uRedline;
  uniform float uGlow;
  uniform float uWidthScale;
  uniform float uGuides;
  uniform float uFlash;

  // Packed to five instance attributes: xyz is the vector the name says, w the extra.
  attribute vec4 aP;      // start (local lattice units) | scatter depth -1..1
  attribute vec4 aQ;      // end | draw order 0..1
  attribute vec4 aJitter; // unit jitter | stroke weight in master units (1, 1.5)
  attribute vec4 aNormal; // unit outward normal | kind (0 beam, 1 guide)
  attribute vec4 aGroup;  // outline, upright, paradox, redline

  varying vec3 vEdge;   // across, past the P end, past the Q end (device px; > 0 is outside)
  varying float vHalf;  // half the stroke, device px
  varying float vHalo;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    bool guide = aNormal.w > 0.5;
    float drawn = guide ? 1.0 : clamp(uDraw * 1.3 - aQ.w * 0.3, 0.0, 1.0);
    float alpha = guide
      ? uGuides * 0.08 * uAlpha
      : uAlpha * (1.0 - uDissolve * aGroup.y) * mix(1.0, uParadox, aGroup.z);

    // Undrawn, dissolved or faded: collapse the quad so it rasterises nothing.
    if (drawn <= 0.0 || alpha <= 0.0005) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }

    vec3 off = cubeOffset(aP.w, aJitter.xyz, aQ.w)
      + aNormal.xyz * (3.0 * uExplode + 0.8 * uRedline * aGroup.w)
      + normalize(aQ.xyz - aP.xyz) * 6.0 * (1.0 - uParadox) * aGroup.z;

    mat4 mvp = projectionMatrix * modelViewMatrix;
    vec4 cp = mvp * vec4(aP.xyz + off, 1.0);
    vec4 cq = mvp * vec4(mix(aP.xyz, aQ.xyz, drawn) + off, 1.0);
    vec2 sp = (cp.xy / cp.w * 0.5 + 0.5) * uViewport;
    vec2 sq = (cq.xy / cq.w * 0.5 + 0.5) * uViewport;

    vec2 span = sq - sp;
    float len = length(span);
    vec2 along = len > 0.0001 ? span / len : vec2(1.0, 0.0);
    vec2 across = vec2(-along.y, along.x);

    float strokePx = guide ? 1.0 : clamp(aJitter.w * uBox / 256.0 * uWidthScale, 1.25, 2.5);
    float haloPx = guide || uGlow <= 0.0 ? 0.0 : 4.0;
    // The AA ramp is 0.75 device px either side; never let the quad clip it.
    float margin = max(0.75, 0.75 * uDpr) + haloPx * uDpr;
    vHalf = strokePx * 0.5 * uDpr;
    float reach = vHalf + margin;

    // Butt ends like the SVG, but the quad runs past them by the margin so the
    // halo rounds off instead of being cut square.
    float end = position.y * 2.0 - 1.0;
    vec2 px = mix(sp, sq, position.y) + across * (position.x * reach) + along * (end * margin);
    vEdge = vec3(
      position.x * reach,
      mix(margin, -(len + margin), position.y),
      mix(-(len + margin), margin, position.y)
    );

    vHalo = haloPx > 0.0 ? 0.35 * uGlow * (1.0 + 2.0 * uFlash) : 0.0;
    vAlpha = alpha;
    vec3 col = mix(mix(LINE, DRAFT, uTint), EMBER, max(uRedline * aGroup.w, uParadoxEmber * aGroup.z));
    vColor = guide ? DRAFT : min(col + uFlash * 0.6, vec3(1.0));

    // Orthographic and depth-free: z is pinned so scatter can never hit a clip plane.
    gl_Position = vec4(px / uViewport * 2.0 - 1.0, 0.0, 1.0);
  }
`;

const BEAM_FRAG = /* glsl */ `
  uniform float uDpr;
  varying vec3 vEdge;
  varying float vHalf;
  varying float vHalo;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float d = abs(vEdge.x);
    float past = max(vEdge.y, vEdge.z);
    float core = (1.0 - smoothstep(vHalf - 0.75, vHalf + 0.75, d)) * clamp(0.5 - past, 0.0, 1.0);
    float beyond = max(past, 0.0);
    float halo = vHalo * exp(-(d * d + beyond * beyond) / (8.0 * uDpr * uDpr));
    float a = (core + halo * (1.0 - core)) * vAlpha;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

const DUST_VERT = /* glsl */ `
  ${COMMON}
  uniform float uDetach;
  uniform float uBurst;

  attribute vec4 aQ;      // segment end | position along it 0..1 (segment start is position)
  attribute vec4 aSeg;    // scatter depth, draw order, upright, seed
  attribute vec3 aJitter;
  attribute vec3 aNormal;

  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float seed = aSeg.w;
    float upright = aSeg.z;
    // Visible while the cube is apart, while its uprights dissolve, and for
    // the length of a lock burst (a bell, so a burst fades out as it spreads).
    float bell = 4.0 * uBurst * (1.0 - uBurst);
    float shown = max(uDetach, max(uDissolve * upright, bell));
    float alpha = uAlpha * shown * (0.35 + 0.45 * fract(seed * 7.31));
    if (alpha <= 0.002) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }

    vec3 p = mix(position, aQ.xyz, aQ.w)
      + cubeOffset(aSeg.x, aJitter, aSeg.y)
      + aNormal * (2.0 + seed * 4.0) * uExplode;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);

    // View space is CSS px here (orthographic, zoom 1).
    mv.y += uDissolve * upright * (40.0 + seed * 80.0);
    // Burst: straight out from the cube's centre (the view-space origin of the group).
    vec2 fromCentre = mv.xy - modelViewMatrix[3].xy;
    float r = length(fromCentre);
    mv.xy += (r > 0.001 ? fromCentre / r : vec2(0.0)) * uBurst * 40.0 * seed;

    gl_Position = projectionMatrix * mv;
    gl_Position.z = 0.0;
    gl_PointSize = (2.0 + seed) * uDpr;
    vAlpha = alpha;
    vColor = mix(LINE, DRAFT, uTint);
  }
`;

const DUST_FRAG = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = (1.0 - smoothstep(0.1, 0.5, r)) * vAlpha;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

function createUniforms() {
  return {
    uViewport: { value: new Vector2(1, 1) },
    uDpr: { value: 1 },
    uBox: { value: 256 },
    uScatter: { value: 0 },
    uJitter: { value: 0 },
    uExplode: { value: 0 },
    uDraw: { value: 1 },
    uDissolve: { value: 0 },
    uParadox: { value: 1 },
    uParadoxEmber: { value: 0 },
    uTint: { value: 0 },
    uRedline: { value: 0 },
    uGlow: { value: 0.5 },
    uWidthScale: { value: 1 },
    uGuides: { value: 0 },
    uAlpha: { value: 1 },
    uFlash: { value: 0 },
    uBurst: { value: 0 },
    uDetach: { value: 0 },
  };
}

export type CubeUniforms = ReturnType<typeof createUniforms>;

const bit = (group: number, flag: number) => ((group & flag) !== 0 ? 1 : 0);

function createBeams(uniforms: CubeUniforms): Mesh<InstancedBufferGeometry, ShaderMaterial> {
  const geometry = new InstancedBufferGeometry();
  // corner.x ∈ {-1, 1} across the line, corner.y ∈ {0, 1} along it (P → Q).
  geometry.setAttribute("position", new Float32BufferAttribute([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0], 3));
  geometry.setIndex([0, 1, 2, 2, 1, 3]);

  const p = new Float32Array(BEAM_COUNT * 4);
  const q = new Float32Array(BEAM_COUNT * 4);
  const jitter = new Float32Array(BEAM_COUNT * 4);
  const normal = new Float32Array(BEAM_COUNT * 4);
  const group = new Float32Array(BEAM_COUNT * 4);

  SEGMENTS.forEach((segment, i) => {
    p.set([...local(segment.p), segment.depth], i * 4);
    q.set([...local(segment.q), segment.order], i * 4);
    jitter.set([...segment.jitter, segment.w], i * 4);
    normal.set([...segment.normal, 0], i * 4);
    group.set(
      [
        bit(segment.group, GROUP.OUTLINE),
        bit(segment.group, GROUP.UPRIGHT),
        bit(segment.group, GROUP.PARADOX),
        bit(segment.group, GROUP.REDLINE),
      ],
      i * 4,
    );
  });

  // The construction guides: the three iso axes through the cube's centre, in
  // local space, so they turn with the camera. Kind 1, no group, no offsets.
  for (let axis = 0; axis < 3; axis++) {
    const i = SEGMENTS.length + axis;
    const from = [0, 0, 0];
    const to = [0, 0, 0];
    from[axis] = -GUIDE_REACH;
    to[axis] = GUIDE_REACH;
    p.set([...from, 0], i * 4);
    q.set([...to, 0], i * 4);
    jitter.set([0, 0, 0, 1], i * 4);
    normal.set([0, 0, 0, 1], i * 4);
  }

  geometry.setAttribute("aP", new InstancedBufferAttribute(p, 4));
  geometry.setAttribute("aQ", new InstancedBufferAttribute(q, 4));
  geometry.setAttribute("aJitter", new InstancedBufferAttribute(jitter, 4));
  geometry.setAttribute("aNormal", new InstancedBufferAttribute(normal, 4));
  geometry.setAttribute("aGroup", new InstancedBufferAttribute(group, 4));
  geometry.instanceCount = BEAM_COUNT;

  const material = new ShaderMaterial({
    vertexShader: BEAM_VERT,
    fragmentShader: BEAM_FRAG,
    uniforms,
    // The quads are built in screen space with a fixed winding that happens to
    // read as back-facing; there is nothing to cull, so cull nothing.
    side: DoubleSide,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    premultipliedAlpha: true,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneMinusSrcAlphaFactor,
  });

  const mesh = new Mesh(geometry, material);
  // The bounding sphere of a 4-vertex quad says nothing about where beams land.
  mesh.frustumCulled = false;
  mesh.renderOrder = 0;
  return mesh;
}

function createDust(uniforms: CubeUniforms): Points<BufferGeometry, ShaderMaterial> {
  // Particles sit on the beams at uniform density: pick a point along the
  // cube's total line length, so long edges carry more dust than short ones.
  const lengths = SEGMENTS.map(({ p, q }) => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]));
  const total = lengths.reduce((sum, length) => sum + length, 0);

  // Its own fixed seed, so the dust is identical on every load.
  let seed = 0x2c9e7b;
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };

  const position = new Float32Array(DUST_COUNT * 3);
  const q = new Float32Array(DUST_COUNT * 4);
  const seg = new Float32Array(DUST_COUNT * 4);
  const jitter = new Float32Array(DUST_COUNT * 3);
  const normal = new Float32Array(DUST_COUNT * 3);

  for (let n = 0; n < DUST_COUNT; n++) {
    let pick = rand() * total;
    let i = 0;
    while (i < SEGMENTS.length - 1 && pick > lengths[i]) pick -= lengths[i++];
    const segment = SEGMENTS[i];
    position.set(local(segment.p), n * 3);
    q.set([...local(segment.q), rand()], n * 4);
    seg.set([segment.depth, segment.order, bit(segment.group, GROUP.UPRIGHT), rand()], n * 4);
    jitter.set(segment.jitter, n * 3);
    normal.set(segment.normal, n * 3);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(position, 3));
  geometry.setAttribute("aQ", new Float32BufferAttribute(q, 4));
  geometry.setAttribute("aSeg", new Float32BufferAttribute(seg, 4));
  geometry.setAttribute("aJitter", new Float32BufferAttribute(jitter, 3));
  geometry.setAttribute("aNormal", new Float32BufferAttribute(normal, 3));

  // Additive light (colour adds), alpha still composited "over" so the canvas
  // stays a valid premultiplied surface for the page behind it.
  const material = new ShaderMaterial({
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    premultipliedAlpha: true,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    blendSrcAlpha: OneFactor,
    blendDstAlpha: OneMinusSrcAlphaFactor,
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 1;
  points.visible = false;
  return points;
}

export type CubeScene = {
  /** Positioned, rotated and scaled per frame; both draw calls hang off it. */
  root: Group;
  dust: Points<BufferGeometry, ShaderMaterial>;
  /** Shared by both materials, so each value is written once per frame. */
  uniforms: CubeUniforms;
  dispose: () => void;
};

export function createCubeScene(): CubeScene {
  const uniforms = createUniforms();
  const beams = createBeams(uniforms);
  const dust = createDust(uniforms);
  const root = new Group();
  root.add(beams, dust);
  return {
    root,
    dust,
    uniforms,
    dispose() {
      beams.geometry.dispose();
      beams.material.dispose();
      dust.geometry.dispose();
      dust.material.dispose();
    },
  };
}
