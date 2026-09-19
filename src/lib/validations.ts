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
