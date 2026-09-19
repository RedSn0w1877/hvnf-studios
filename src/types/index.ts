import type {
  EngagementType,
  BudgetTier,
  Industry,
  IntakeFormData,
  BookingFormData,
} from "@/lib/validations";

/**
 * Project status lifecycle
 */
export type ProjectStatus =
  | "lead"
  | "quoted"
  | "deposit-paid"
  | "in-progress"
  | "review"
  | "completed"
  | "live"
  | "on-retainer";

/**
 * Project record for internal tracking
 */
export interface Project {
  id: string;
  businessName: string;
  industry: Industry;
  engagementType: EngagementType;
  budgetTier: BudgetTier;
  status: ProjectStatus;
  
  // Financial
  quotedAmount: number;
  depositPaid: number;
  finalPaid: number;
  
  // Timeline
  inquiryDate: Date;
  depositDate?: Date;
  launchDate?: Date;
  
  // Contacts
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  
  // Deliverables
  deliveryUrl?: string; // Vercel preview URL
  liveUrl?: string;     // Custom domain after DNS transfer
  
  // Notes
  notes?: string;
  referralSource?: string;
}

/**
 * Studio capabilities for portfolio display
 */
export interface Capability {
  id: string;
  title: string;
  description: string;
  category: "design" | "development" | "motion" | "strategy";
  icon?: string; // lucide-react icon name
  featured?: boolean;
}

/**
 * Showcase piece metadata
 */
export interface ShowcaseProject {
  id: string;
  title: string;
  slug: string;
  industry: Industry;
  
  // Visuals
  thumbnail: string;
  screenshots: string[];
  liveUrl?: string;
  
  // Content
  tagline: string;
  description: string;
  challenge?: string;
  solution?: string;
  
  // Tech
  stack: string[];
  features: string[];
  
  // Metadata
  completedDate: Date;
  featured: boolean;
  watermarked: boolean; // Must be true for portfolio pieces
}

/**
 * Care Plan subscription tiers
 */
export interface CarePlan {
  tier: "essential" | "professional" | "enterprise";
  monthlyRate: number;
  includedHours: number;
  features: string[];
  priority: "standard" | "priority" | "dedicated";
}

/**
 * Active retainer client
 */
export interface RetainerClient {
  id: string;
  projectId: string;
  businessName: string;
  plan: CarePlan;
  
  // Billing
  stripeCustomerId?: string;
  billingStartDate: Date;
  nextBillingDate: Date;
  
  // Usage tracking
  hoursUsedThisMonth: number;
  lastUpdateDate?: Date;
  
  // Support
  seoReportSchedule: "monthly" | "quarterly";
  lastSeoReport?: Date;
}

/**
 * Intake submission from public form
 */
export interface IntakeSubmission extends IntakeFormData {
  id: string;
  submittedAt: Date;
  status: "new" | "reviewing" | "quoted" | "converted" | "declined";
  assignedTo?: "architect" | "nathan";
}

/**
 * Analytics snapshot for internal dashboard
 */
export interface StudioMetrics {
  period: "month" | "quarter" | "year";
  startDate: Date;
  endDate: Date;
  
  // Revenue
  totalRevenue: number;
  buildsRevenue: number;
  retainerRevenue: number;
  
  // Volume
  projectsCompleted: number;
  activeRetainers: number;
  newLeads: number;
  conversionRate: number;
  
  // Pipeline
  quotedValue: number;
  inProgressValue: number;
}

/**
 * Re-export validation types for convenience
 */
export type {
  EngagementType,
  BudgetTier,
  Industry,
  IntakeFormData,
  BookingFormData,
};
