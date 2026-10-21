"use client";

import { useCallback, useSyncExternalStore } from "react";
import { LITE_MAX_CORES, LITE_MAX_MEMORY_GB, LITE_QUERIES, LITE_SLOW_NETWORK } from "./device";

export type DeviceProfile = { lite: boolean };

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: EventTarget & { saveData?: boolean; effectiveType?: string };
};

// The rules live in device.ts so the <head> script that guesses before first
// paint and this live hook always agree. The MediaQueryLists are built once:
// isLite() runs on every render that reads the store.
let mediaLists: MediaQueryList[] | null = null;
const liteMedia = () => (mediaLists ??= LITE_QUERIES.map((query) => window.matchMedia(query)));

function isLite() {
  const nav = navigator as NavigatorWithHints;
  return liteMedia().some((list) => list.matches)
    || (nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= LITE_MAX_CORES)
    || (nav.deviceMemory !== undefined && nav.deviceMemory <= LITE_MAX_MEMORY_GB)
    || nav.connection?.saveData === true
    || LITE_SLOW_NETWORK.test(nav.connection?.effectiveType ?? "");
}

function subscribeDevice(notify: () => void) {
  const media = liteMedia();
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
