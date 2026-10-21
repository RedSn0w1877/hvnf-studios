/**
 * The page's shared scratchpad between the scroll clock and the Stage.
 *
 * A plain mutable object, never React state: scrollY is written on every Lenis
 * scroll frame and read on every ticker frame, and a re-render for either would
 * cost more than the frame itself.
 *
 *  - scrollY: Lenis's smoothed scroll position, written by page.tsx.
 *  - paused: true while the intake drawer is open, so the Stage renders nothing.
 *  - pointerX / pointerY: the cursor in -1..1, written by the Stage's own
 *    passive pointermove listener.
 */
export type Bus = {
  scrollY: number;
  paused: boolean;
  pointerX: number;
  pointerY: number;
};

export const bus: Bus = { scrollY: 0, paused: false, pointerX: 0, pointerY: 0 };
