"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { PART_ORDER, type CubePart } from "@/lib/cube";
import { HERO_CALLOUTS } from "./cube-art";
import s from "./hero.module.css";

/**
 * The hero's cube, as a real solid: twelve square beams joined by eight corner
 * blocks, with a diagonal brace through the middle, built from CSS 3D boxes.
 * It is the same object from every angle, so it always hangs together.
 *
 * It rests in the isometric view the logo is drawn in. Dragging turns it (a
 * sideways drag on a phone still scrolls the page); a moment after you let go
 * it swings back to the logo's angle. Nothing moves on its own: no timers or
 * frames run while it sits still, only pointer events and one CSS transition.
 *
 * Units. The cube is 2 across, centred on 0, y up, z toward the viewer; a beam
 * is T thick. One cube unit is K viewBox units, so the hexagon at rest fills the
 * same 176 x 200 box the flat drawing did, and the page's label anchors
 * (HERO_CALLOUTS) and its leader lines still land on it.
 */

const T = 0.3;
const BT = 0.2; // the brace's thickness
const K = 88 / ((1 + T / 2) * Math.SQRT2);
const REST_RX = -35.264; // degrees: the true isometric tilt, atan(1 / sqrt 2)
const REST_RY = 45;

type Vec = readonly [number, number, number];
type Box = { c: Vec; size: Vec; part: CubePart; brace?: boolean };

const BOXES: Box[] = (() => {
  const out: Box[] = [];
  const sgn = [-1, 1] as const;
  const beam = 2 - T;
  for (const a of sgn)
    for (const b of sgn) {
      // along x at (y = a, z = b)
      out.push({ c: [0, a, b], size: [beam, T, T], part: a > 0 ? "top" : b > 0 ? "right" : "left" });
      // along z at (x = a, y = b)
      out.push({ c: [a, b, 0], size: [T, T, beam], part: b > 0 ? "top" : a > 0 ? "right" : "left" });
      // along y at (x = a, z = b)
      out.push({ c: [a, 0, b], size: [T, beam, T], part: a < 0 ? "left" : "right" });
    }
  for (const x of sgn)
    for (const y of sgn)
      for (const z of sgn) out.push({ c: [x, y, z], size: [T, T, T], part: y > 0 ? "top" : x < 0 ? "left" : "right" });
  out.push({ c: [0, 0, 0], size: [BT, BT, 2 * Math.sqrt(3) - 0.35], part: "brace", brace: true });
  return out;
})();

/** Where a point of the cube lands in viewBox units at the rest angle. */
function rest([x, y, z]: Vec): [number, number] {
  const th = (REST_RY * Math.PI) / 180;
  const ph = (-REST_RX * Math.PI) / 180;
  const x1 = x * Math.cos(th) + z * Math.sin(th);
  const z1 = -x * Math.sin(th) + z * Math.cos(th);
  const up = y * Math.cos(ph) - z1 * Math.sin(ph);
  return [Math.round((128 + x1 * K) * 10) / 10, Math.round((128 - up * K) * 10) / 10];
}

/**
 * Where each leader lands on the cube (`dot`) and where the phone layout's
 * numbered disc sits (`disc`), per part.
 */
export const HERO_LEADS: Record<CubePart, { dot: [number, number]; disc: [number, number] }> = {
  top: { dot: rest([0, 1, -1]), disc: rest([0, 1, 0]) },
  left: { dot: rest([-1, 0, -1]), disc: rest([-1, 0, 0]) },
  right: { dot: rest([0, -1, 1]), disc: rest([0, 0, 1]) },
  brace: { dot: rest([-0.6, -0.6, -0.6]), disc: rest([0.5, 0.5, 0.5]) },
};

const FACES = [
  ["z", 1],
  ["z", -1],
  ["x", 1],
  ["x", -1],
  ["y", 1],
  ["y", -1],
] as const;

function Box({ c, size, part, brace }: Box) {
  const style = {
    "--bx": c[0],
    "--by": -c[1],
    "--bz": c[2],
    "--sx": size[0],
    "--sy": size[1],
    "--sz": size[2],
  } as CSSProperties;
  return (
    <div className={s.bm} data-part={part} data-brace={brace ? "" : undefined} style={style}>
      {FACES.map(([axis, dir]) => (
        <i key={axis + dir} className={s.f} data-o={axis} data-d={dir > 0 ? "p" : "n"} />
      ))}
    </div>
  );
}

const PATH = (p: readonly number[]) => p.join(" ");

export function HeroCube() {
  const scene = useRef<HTMLDivElement>(null);
  const rig = useRef<HTMLDivElement>(null);
  const st = useRef({ rx: REST_RX, ry: REST_RY, x: 0, y: 0, id: -1, timer: 0 });

  useEffect(() => {
    const el = scene.current;
    const rg = rig.current;
    if (!el || !rg) return;
    const state = st.current;
    const section = el.closest("section");
    const apply = () => {
      rg.style.setProperty("--rx", `${state.rx}deg`);
      rg.style.setProperty("--ry", `${state.ry}deg`);
    };
    const finish = () => {
      // Swing home by the shortest way round.
      state.ry = REST_RY + 360 * Math.round((state.ry - REST_RY) / 360);
      state.rx = REST_RX;
      rg.removeAttribute("data-drag");
      apply();
      state.timer = window.setTimeout(() => section?.removeAttribute("data-cube-drag"), 1000);
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      window.clearTimeout(state.timer);
      state.id = e.pointerId;
      state.x = e.clientX;
      state.y = e.clientY;
      el.setPointerCapture(e.pointerId);
      rg.setAttribute("data-drag", "");
      section?.setAttribute("data-cube-drag", "");
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== state.id) return;
      state.ry += (e.clientX - state.x) * 0.5;
      state.rx = Math.max(-88, Math.min(8, state.rx - (e.clientY - state.y) * 0.5));
      state.x = e.clientX;
      state.y = e.clientY;
      apply();
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== state.id) return;
      state.id = -1;
      window.clearTimeout(state.timer);
      state.timer = window.setTimeout(finish, 1100);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      window.clearTimeout(state.timer);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div ref={scene} className={s.scene} aria-hidden>
      <div ref={rig} className={s.rig} style={{ "--k": K } as CSSProperties}>
        {BOXES.map((b, i) => (
          <Box key={i} {...b} />
        ))}
      </div>
      <svg className={s.over} viewBox="40 28 176 200" fill="none" strokeLinecap="round" focusable="false">
        <g className="cube-leaders">
          {HERO_CALLOUTS.map(({ part, anchor }) => {
            const dot = HERO_LEADS[part].dot;
            const line = `M${PATH(anchor)} L${PATH(dot)}`;
            return (
              <g key={part} className="cube-leader" data-part={part} style={{ transformOrigin: `${dot[0]}px ${dot[1]}px` }}>
                {/* An ember halo under the hairline, so it cuts cleanly across the black beams. */}
                <path d={line} stroke="#EF4623" strokeWidth={2.6} />
                <path d={line} stroke="#15120F" strokeWidth={0.56} />
                <circle cx={dot[0]} cy={dot[1]} r={1.75} fill="#F1EADB" stroke="#15120F" strokeWidth={0.7} />
              </g>
            );
          })}
        </g>
        <g className="cube-discs">
          {PART_ORDER.map((part, i) => {
            const [x, y] = HERO_LEADS[part].disc;
            return (
              <g key={part} className="cube-disc" data-part={part} style={{ transformOrigin: `${x}px ${y}px` }}>
                <circle cx={x} cy={y} r={8.6} fill="#F1EADB" stroke="#15120F" strokeWidth={1.6} />
                <text x={x} y={y + 4.1} textAnchor="middle" fontSize={11.5} fontWeight={800} fill="#15120F" className="font-display">
                  {i + 1}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
