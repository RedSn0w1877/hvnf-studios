"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Performance plumbing for the studio site.
 *
 * Two jobs:
 *  1. Decide whether this device should get the full WebGL treatment at all.
 *  2. Let expensive things (the live site embeds) tell the background to stand
 *     down while they are on screen, so we never run four WebGL contexts at once.
 */

/* ------------------------------------------------------------------ */
/* Device profile                                                      */
/* ------------------------------------------------------------------ */

export type DeviceProfile = {
  /** Skip the heavy decorative layers: small screens, weak CPUs, data saver, reduced motion. */
  lite: boolean;
};

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

function measure(): DeviceProfile {
  if (typeof window === "undefined") return { lite: true };

  const nav = navigator as NavigatorWithHints;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  const coarseAndSmall = window.matchMedia("(pointer: coarse) and (max-width: 1024px)").matches;
  const fewCores = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const saveData = nav.connection?.saveData === true;
  const slowLink = /^(slow-2g|2g|3g)$/.test(nav.connection?.effectiveType ?? "");

  return { lite: reduced || narrow || coarseAndSmall || fewCores || lowMemory || saveData || slowLink };
}

/**
 * Starts "lite" so the server render and the first paint are always the cheap path;
 * the real measurement lands right after mount and only ever turns effects on.
 */
export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>({ lite: true });

  useEffect(() => {
    const apply = () => setProfile(measure());
    apply();
    const media = window.matchMedia("(max-width: 767px)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return profile;
}

/* ------------------------------------------------------------------ */
/* Heavy-frame budget                                                  */
/* ------------------------------------------------------------------ */

let heavyCount = 0;
const listeners = new Set<() => void>();

/** Called by an embed when it mounts / unmounts. */
export function setHeavyActive(active: boolean) {
  const next = Math.max(0, heavyCount + (active ? 1 : -1));
  if (next === heavyCount) return;
  heavyCount = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True while at least one expensive embed is live on screen. */
export function useHeavyActive(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => heavyCount > 0,
    () => false,
  );
}

/** Read the live count without subscribing — for render loops. */
export const isHeavyActive = () => heavyCount > 0;

/* ------------------------------------------------------------------ */
/* Page visibility                                                     */
/* ------------------------------------------------------------------ */

/** True when the tab is actually being looked at. Render loops should idle otherwise. */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const apply = () => setVisible(document.visibilityState === "visible");
    apply();
    document.addEventListener("visibilitychange", apply);
    return () => document.removeEventListener("visibilitychange", apply);
  }, []);

  return visible;
}
