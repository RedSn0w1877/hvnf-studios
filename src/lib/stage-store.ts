/**
 * Strength of the work section's particle pillar, 0 to 1.
 *
 * Written by the work section's scroll loop, read by the stage's frame loop. A
 * plain mutable object on purpose: this changes every frame, and routing it
 * through React state would re-render the whole canvas tree for a number that
 * only a shader cares about.
 */
export const pillarStore = { value: 0 };
