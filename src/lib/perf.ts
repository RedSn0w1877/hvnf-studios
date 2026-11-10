"use client";

import { useSyncExternalStore } from "react";
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
