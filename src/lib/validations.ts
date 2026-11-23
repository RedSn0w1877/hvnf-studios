import { z } from "zod";

/**
 * Engagement type enum matching studio service tiers
 */
export const engagementTypeSchema = z.enum([
  "landing-page",
  "small-site",
  "full-build",
  "care-plan",
  "consultation",
]);

/**
 * Budget tier schema for Phase 1-3 pricing alignment
 */
export const budgetTierSchema = z.enum([
  "phase-1-500-1k",    // $500–1k builds (Phase 1)
  "phase-2-1.5-3k",    // $1.5–3k builds (Phase 2)
  "phase-3-5k-plus",   // $5–10k+ projects (Phase 3)
  "retainer-99-199",   // Care Plans $99–199/mo
  "custom",
]);

/**
 * Industry category schema for palette/copy alignment
 */
export const industrySchema = z.enum([
  "automotive",
  "trades",
  "medical-dental",
  "fitness",
  "dining-hospitality",
  "professional-services",
  "luxury-contractor",
  "other",
]);

/**
 * Client intake form validation schema
 */
export const intakeFormSchema = z.object({
  // Business details
  businessName: z.string().min(2, "Business name required").max(100),
  industry: industrySchema,
  website: z.string().url("Valid URL required").optional().or(z.literal("")),
  
  // Contact info
  contactName: z.string().min(2, "Contact name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().regex(/^[\d\s\-\(\)]+$/, "Valid phone number required").min(10),
  
  // Project scope
  engagementType: engagementTypeSchema,
  budgetTier: budgetTierSchema,
  timeline: z.enum(["urgent-1-week", "standard-2-4-weeks", "flexible"]),
  
  // Pain points and goals
  currentChallenges: z.string().min(20, "Tell us what's not working (20+ chars)").max(1000),
  goals: z.string().min(20, "What success looks like (20+ chars)").max(1000),
  
  // Competitors/inspiration (optional)
  competitorSites: z.string().max(500).optional(),
  
  // Metadata
  referralSource: z.enum([
    "google",
    "referral",
    "social",
    "portfolio",
    "cold-outreach",
    "other",
  ]).optional(),
  
  // Consent
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "Must agree to terms",
  }),
});

/**
 * Type inference from schema
 */
export type IntakeFormData = z.infer<typeof intakeFormSchema>;
export type EngagementType = z.infer<typeof engagementTypeSchema>;
export type BudgetTier = z.infer<typeof budgetTierSchema>;
export type Industry = z.infer<typeof industrySchema>;

/**
 * Booking form validation for care plan clients
 */
export const bookingFormSchema = z.object({
  clientId: z.string().uuid(),
  requestType: z.enum(["content-update", "bug-fix", "seo-report", "consultation"]),
  description: z.string().min(20).max(1000),
  urgency: z.enum(["low", "medium", "high"]),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;

/* ────────────────────────────────────────────────────────────────────────────
 * The homepage "Ask for a preview" request.
 *
 * One definition, used twice: the card checks each field as the visitor moves
 * on (so the messages below are what they read), and POST /api/request checks
 * the whole body again on the server, because the browser is not to be trusted.
 * Every field has a length cap, every text field is trimmed, and single-line
 * fields lose control characters (no line breaks into a subject or header).
 * ──────────────────────────────────────────────────────────────────────────── */

export const BUSINESS_KINDS = [
  { id: "auto", label: "Car shop, detailer or dealer" },
  { id: "trades", label: "Trades (plumbing, electrical, HVAC, roofing…)" },
  { id: "medical", label: "Dental, medical or wellness" },
  { id: "fitness", label: "Gym, studio or personal training" },
  { id: "food", label: "Restaurant, café or bar" },
  { id: "professional", label: "Law, accounting or other professional service" },
  { id: "other", label: "Something else" },
] as const;

export const NEEDS = [
  { id: "new", label: "A new site", note: "Nothing there yet, or starting over" },
  { id: "replace", label: "Replace what we have", note: "It’s slow or a pain to update" },
  { id: "booking", label: "Take bookings or calls", note: "Online booking, or an easy way for people to call" },
  { id: "care", label: "Look after our site", note: "We host it and make small changes for you" },
] as const;

export const TIMINGS = [
  { id: "soon", label: "As soon as you can" },
  { id: "month", label: "Within a month or two" },
  { id: "looking", label: "Just looking for now" },
] as const;

export const ACTIONS = [
  { id: "call", label: "Call us" },
  { id: "book", label: "Book an appointment" },
  { id: "quote", label: "Ask for a quote" },
] as const;

const ids = <T extends readonly { id: string }[]>(list: T) => list.map((item) => item.id) as [T[number]["id"], ...T[number]["id"][]];

// Anything that could break a header, a subject line or a plain-text layout.
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u2028\u2029]/g;
const oneLine = (value: string) => value.replace(/[\r\n\t]+/g, " ").replace(CONTROL, "");
const manyLines = (value: string) => value.replace(/\r\n?/g, "\n").replace(CONTROL, "");

const tooLong = (max: number) => `Please keep this under ${max} characters.`;
const line = (max: number) => z.string().trim().max(max, tooLong(max)).transform(oneLine);
const text = (max: number) => z.string().trim().max(max, tooLong(max)).transform(manyLines);

/** Each field on its own, so the card can check one at a time. */
export const requestFields = {
  name: line(100).pipe(z.string().min(2, "Please add your name.")),
  // Deliberately loose: a strict pattern rejects real addresses more often than it saves anyone.
  email: z
    .string()
    .trim()
    .max(254, tooLong(254))
    .regex(/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/, "Please add an email we can reply to."),
  phone: z
    .string()
    .trim()
    .max(30, tooLong(30))
    .refine((v) => v === "" || (/^[0-9+().\-\s]+$/.test(v) && v.replace(/\D/g, "").length >= 7), "That doesn’t look like a phone number."),
  business: line(120).pipe(z.string().min(2, "Please add your business name.")),
  businessKind: z.enum(ids(BUSINESS_KINDS), { error: "Please pick the closest kind of business." }),
  town: line(100).pipe(z.string().min(2, "Please add the town you’re in.")),
  current: line(200),
  need: z.enum(ids(NEEDS), { error: "Please pick what you need." }),
  timing: z.enum(ids(TIMINGS), { error: "Please pick when you need it." }),
  problem: text(1000).pipe(z.string().min(3, "Please tell us the biggest problem, even in a few words.")),
  actions: z
    .array(z.enum(ids(ACTIONS)), { error: "Please pick at least one." })
    .min(1, "Please pick at least one.")
    .max(ACTIONS.length),
  links: text(600),
  brand: text(300),
  hours: text(300),
  services: text(800),
  extra: text(1500),
};

export type RequestField = keyof typeof requestFields;

/** What the server accepts: the fields, plus the two anti-spam signals. */
export const previewRequestSchema = z.object({
  ...requestFields,
  /** The honeypot. Real visitors never see it, so it stays empty. */
  nickname: z.string().max(200).optional().default(""),
  /** When the card opened (ms since 1970), so a form sent in under three seconds is a script. */
  openedAt: z.number().int().positive(),
});

export type PreviewRequest = z.infer<typeof previewRequestSchema>;
/** The fields alone, as the card holds them (the actions as a list). */
export type RequestDetails = { [K in RequestField]: z.input<(typeof requestFields)[K]> };
