import { SHOTS, type Shot } from "@/assets/work";

/**
 * Everything the portfolio bento shows, one entry per step.
 *
 * Copied from the homepage's examples (src/components/site/work.tsx, BUILDS) on
 * purpose rather than imported: that file belongs to the homepage and changes
 * on its own schedule. Titles, sectors, blurbs and links match it word for word.
 * The sticker facts come from each demo's own README and pages: features the
 * live site really has, never a review, a rating or an invented number.
 *
 * Every colour pair below was measured for WCAG AA (contrast noted beside it).
 */

export type Sticker = {
  /** Two or three short words, set large inside the circle. */
  text: string;
};

/** Where a moving part sits in the picture box: centre as a fraction of its width and height, plus a turn. */
export type Spot = { x: number; y: number; r: number };

export type Palette = {
  /** The page ground around the boxes. */
  ground: string;
  /** Every box. */
  box: string;
  /** Text on a box. */
  ink: string;
  /** The full-width button in the headline box. */
  pillBg: string;
  pillFg: string;
  /** The three stickers: dark, pale, accent. */
  s1: [bg: string, fg: string, ring: string];
  s2: [bg: string, fg: string, ring: string];
  s3: [bg: string, fg: string, ring: string];
  /** The device's bezel. */
  bezel: string;
};

export type Layout = {
  /** The headline box's share of the width on a desktop (the picture box takes the rest). */
  split: number;
  device: Spot;
  orbit: Spot;
  stickers: [Spot, Spot, Spot];
  cursor: Spot;
  star: Spot;
};

export type Step = {
  id: string;
  title: string;
  sector: string;
  /** What a visitor does there, in one plain sentence. */
  headline: string;
  blurb: string;
  href: string;
  /** "Visit Penner & Daughters": the link text. */
  cta: string;
  external: boolean;
  shot: Shot | null;
  stickers: [Sticker, Sticker, Sticker];
  palette: Palette;
  layout: Layout;
};

export const STEPS: readonly Step[] = [
  {
    id: "penner",
    title: "Penner & Daughters",
    sector: "Auto repair",
    headline: "Hear your car’s noise, then approve the fix.",
    blurb: "Pick the noise your car is making and hear it. Then approve the repair estimate one line at a time.",
    href: "https://redsn0w1877.github.io/penner-and-daughters/",
    cta: "Visit Penner & Daughters",
    external: true,
    shot: SHOTS.penner,
    stickers: [{ text: "Six car noises" }, { text: "Line-by-line estimate" }, { text: "Book online" }],
    palette: {
      ground: "#ECEDEE",
      box: "#C9CDD1", // ink on box 11.5
      ink: "#121417",
      pillBg: "#F6F7F8",
      pillFg: "#121417",
      s1: ["#121417", "#C9CDD1", "transparent"], // 11.5
      s2: ["#F6F7F8", "#121417", "transparent"], // 17.2
      s3: ["#1B44A3", "#FFFFFF", "transparent"], // 8.7
      bezel: "#121417",
    },
    layout: {
      split: 0.5,
      device: { x: 0.5, y: 0.52, r: -9 },
      orbit: { x: 0.56, y: 0.54, r: 0 },
      stickers: [
        { x: 0.2, y: 0.17, r: -6 },
        { x: 0.84, y: 0.23, r: 8 },
        { x: 0.81, y: 0.84, r: -4 },
      ],
      cursor: { x: 0.18, y: 0.82, r: 0 },
      star: { x: 0.07, y: 0.93, r: 0 },
    },
  },
  {
    id: "kroma",
    title: "Kroma Labs",
    sector: "Keyboards",
    headline: "Press a key and hear the switch you picked.",
    blurb: "Press a key on your own keyboard and the same key goes down in the photo, with the click of the switch you picked.",
    href: "https://redsn0w1877.github.io/kroma-labs/",
    cta: "Visit Kroma Labs",
    external: true,
    shot: SHOTS.kroma,
    stickers: [{ text: "Three switch sounds" }, { text: "Your keys, live" }, { text: "75% board" }],
    palette: {
      ground: "#EFEDE6",
      box: "#F2C200", // ink on box 11.0
      ink: "#141414",
      pillBg: "#FBF6E6",
      pillFg: "#141414",
      s1: ["#141414", "#F2C200", "transparent"], // 11.0
      s2: ["#FBF6E6", "#141414", "transparent"], // 17.0
      s3: ["#C8341F", "#FFFFFF", "transparent"], // 5.3, set at 18px+ bold
      bezel: "#141414",
    },
    layout: {
      split: 0.46,
      device: { x: 0.5, y: 0.5, r: 7 },
      orbit: { x: 0.44, y: 0.48, r: 0 },
      stickers: [
        { x: 0.82, y: 0.15, r: 7 },
        { x: 0.15, y: 0.26, r: -8 },
        { x: 0.2, y: 0.84, r: 5 },
      ],
      cursor: { x: 0.8, y: 0.8, r: 0 },
      star: { x: 0.93, y: 0.94, r: 45 },
    },
  },
  {
    id: "apex",
    title: "Apex Dynamics",
    sector: "Running shoes",
    headline: "Run 30 km of hills, then cut the shoe open.",
    blurb: "Drag a runner along 30 km of hills and watch the heart rate climb, then cut the shoe open from heel to toe.",
    href: "https://redsn0w1877.github.io/apex-dynamics/",
    cta: "Visit Apex Dynamics",
    external: true,
    shot: SHOTS.apex,
    stickers: [{ text: "218 g shoe" }, { text: "30 km course" }, { text: "X-ray cutaway" }],
    palette: {
      ground: "#E9EAE4",
      box: "#0B0C0A", // chalk on box 17.6
      ink: "#F2F3EC",
      pillBg: "#CCFF00", // night on volt 16.7
      pillFg: "#0B0C0A",
      s1: ["#CCFF00", "#0B0C0A", "transparent"], // 16.7
      s2: ["#F2F3EC", "#0B0C0A", "transparent"], // 17.6
      s3: ["#0B0C0A", "#CCFF00", "#CCFF00"], // 16.7
      bezel: "#2A2C27",
    },
    layout: {
      split: 0.53,
      device: { x: 0.52, y: 0.47, r: -4 },
      orbit: { x: 0.5, y: 0.5, r: 0 },
      stickers: [
        { x: 0.17, y: 0.2, r: -10 },
        { x: 0.83, y: 0.79, r: 6 },
        { x: 0.81, y: 0.19, r: 9 },
      ],
      cursor: { x: 0.3, y: 0.8, r: 0 },
      star: { x: 0.08, y: 0.9, r: 20 },
    },
  },
  {
    id: "aetheria",
    title: "Aetheria Botanicals",
    sector: "Perfume",
    headline: "Mix a perfume and watch the bottle fill.",
    blurb: "Pick a top, heart and base note and the drawn bottle fills with the color of the perfume you just made.",
    href: "https://redsn0w1877.github.io/aetheria-botanicals/",
    cta: "Visit Aetheria Botanicals",
    external: true,
    shot: SHOTS.aetheria,
    stickers: [{ text: "Top, heart, base" }, { text: "Mix your own" }, { text: "Sealed in wax" }],
    palette: {
      ground: "#EEEAE3",
      box: "#C7A982", // ink on box 8.1
      ink: "#1E150D",
      pillBg: "#F4ECDF",
      pillFg: "#1E150D",
      s1: ["#1E150D", "#E3CFAF", "transparent"], // 11.8
      s2: ["#F4ECDF", "#1E150D", "transparent"], // 15.3
      s3: ["#8A3320", "#F4ECDF", "transparent"], // 7.0
      bezel: "#1E150D",
    },
    layout: {
      split: 0.48,
      device: { x: 0.48, y: 0.53, r: 10 },
      orbit: { x: 0.52, y: 0.46, r: 0 },
      stickers: [
        { x: 0.84, y: 0.82, r: 8 },
        { x: 0.19, y: 0.84, r: -5 },
        { x: 0.82, y: 0.17, r: -9 },
      ],
      cursor: { x: 0.66, y: 0.86, r: 0 },
      star: { x: 0.08, y: 0.08, r: 0 },
    },
  },
  {
    id: "you",
    title: "Your business",
    sector: "HVNF Studios",
    headline: "Get a site like these for your business.",
    blurb: "We build your new site first, and you try it on your phone before you pay anything.",
    href: "/#top",
    cta: "Ask for a preview",
    external: false,
    shot: null,
    stickers: [{ text: "Built from scratch" }, { text: "Preview first" }, { text: "Optional monthly care" }],
    palette: {
      ground: "#EFEBE3",
      box: "#EF4623", // ink on ember 4.95
      ink: "#15120F",
      pillBg: "#F1EADB",
      pillFg: "#15120F",
      s1: ["#15120F", "#F1EADB", "transparent"], // 15.6
      s2: ["#F1EADB", "#15120F", "transparent"], // 15.6
      s3: ["#1747D4", "#FFFFFF", "transparent"], // 7.3
      bezel: "#15120F",
    },
    layout: {
      split: 0.5,
      device: { x: 0.5, y: 0.52, r: 0 },
      orbit: { x: 0.5, y: 0.52, r: 0 },
      stickers: [
        { x: 0.2, y: 0.17, r: -6 },
        { x: 0.84, y: 0.22, r: 6 },
        { x: 0.8, y: 0.85, r: -3 },
      ],
      cursor: { x: 0.22, y: 0.8, r: 0 },
      star: { x: 0.07, y: 0.92, r: 0 },
    },
  },
];

/** The four demos (the last step is HVNF's own closing). */
export const DEMOS = STEPS.filter((step) => step.shot !== null);
