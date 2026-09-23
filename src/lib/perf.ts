"use client";

import { useCallback, useSyncExternalStore } from "react";

export type DeviceProfile = { lite: boolean };

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: EventTarget & { saveData?: boolean; effectiveType?: string };
};

const QUERIES = [
  "(prefers-reduced-motion: reduce)",
  "(max-width: 767px)",
  "(pointer: coarse) and (max-width: 1024px)",
];

function isLite() {
  const nav = navigator as NavigatorWithHints;
  return QUERIES.some((query) => window.matchMedia(query).matches)
    || (nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 4)
    || (nav.deviceMemory !== undefined && nav.deviceMemory <= 4)
    || nav.connection?.saveData === true
    || /^(slow-2g|2g|3g)$/.test(nav.connection?.effectiveType ?? "");
}

function subscribeDevice(notify: () => void) {
  const media = QUERIES.map((query) => window.matchMedia(query));
  const connection = (navigator as NavigatorWithHints).connection;
  media.forEach((query) => query.addEventListener("change", notify));
  connection?.addEventListener("change", notify);
  return () => {
    media.forEach((query) => query.removeEventListener("change", notify));
    connection?.removeEventListener("change", notify);
  };
}

export function useDeviceProfile(): DeviceProfile {
  const lite = useSyncExternalStore(subscribeDevice, isLite, () => true);
  return { lite };
}

let heavyCount = 0;
const listeners = new Set<() => void>();

export function setHeavyActive(active: boolean) {
  const next = Math.max(0, heavyCount + (active ? 1 : -1));
  if (next === heavyCount) return;
  heavyCount = next;
  listeners.forEach((listener) => listener());
}

function subscribeHeavy(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHeavyActive(): boolean {
  return useSyncExternalStore(subscribeHeavy, () => heavyCount > 0, () => false);
}

export const isHeavyActive = () => heavyCount > 0;

function subscribeVisibility(notify: () => void) {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
}

/**
 * A media query as a boolean. Server and first client render both answer false,
 * so markup matches on hydration and the real answer lands on the next commit.
 */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    useCallback(
      (notify: () => void) => {
        const list = window.matchMedia(query);
        list.addEventListener("change", notify);
        return () => list.removeEventListener("change", notify);
      },
      [query],
    ),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function usePageVisible(): boolean {
  return useSyncExternalStore(subscribeVisibility, () => document.visibilityState === "visible", () => true);
}
