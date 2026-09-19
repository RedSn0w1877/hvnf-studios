"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { z } from "zod";

const engagementTypes = [
  { id: "flagship", label: "Full Brand Flagship", desc: "Complete digital presence rebuild" },
  { id: "webapp", label: "High-Performance Web App", desc: "Custom application development" },
  { id: "modernization", label: "Commercial Modernization", desc: "Legacy system transformation" },
  { id: "retainer", label: "Managed Retainer Plan", desc: "Ongoing care and optimization" },
] as const;

const budgetTiers = [
  { id: "tier1", label: "$2,500–$5,000", min: 2500, max: 5000 },
  { id: "tier2", label: "$5,000–$10,000", min: 5000, max: 10000 },
  { id: "tier3", label: "$10,000+", min: 10000, max: null },
] as const;

const clientDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().min(2, "Company name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid phone number required"),
  currentWebsite: z.string().url("Valid URL required").optional().or(z.literal("")),
  projectGoals: z.string().min(20, "Please provide at least 20 characters describing your goals"),
});

type ClientDetails = z.infer<typeof clientDetailsSchema>;

interface IntakeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IntakeDrawer({ isOpen, onClose }: IntakeDrawerProps) {
  const [step, setStep] = useState(1);
  const [selectedEngagement, setSelectedEngagement] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    name: "",
    company: "",
    email: "",
    phone: "",
    currentWebsite: "",
    projectGoals: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ClientDetails, string>>>({});
  const [ticketRef, setTicketRef] = useState<string | null>(null);

  const generateTicketRef = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `HVNF-TK-${timestamp}-${random}`;
  };

  const handleNext = () => {
    if (step === 3) {
      const validation = clientDetailsSchema.safeParse(clientDetails);
      if (!validation.success) {
        const fieldErrors: Partial<Record<keyof ClientDetails, string>> = {};
        (validation.error as any).errors.forEach((err: any) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ClientDetails] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
      const ref = generateTicketRef();
      setTicketRef(ref);
      setStep(4);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedEngagement(null);
    setSelectedBudget(null);
    setClientDetails({
      name: "",
      company: "",
      email: "",
      phone: "",
      currentWebsite: "",
      projectGoals: "",
    });
    setErrors({});
    setTicketRef(null);
    onClose();
  };

  const updateField = (field: keyof ClientDetails, value: string) => {
    setClientDetails((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const canProceed = () => {
    if (step === 1) return selectedEngagement !== null;
    if (step === 2) return selectedBudget !== null;
    if (step === 3) {
      return (
        clientDetails.name.length >= 2 &&
        clientDetails.company.length >= 2 &&
        clientDetails.email.includes("@") &&
        clientDetails.phone.length >= 10 &&
        clientDetails.projectGoals.length >= 20
      );
    }
    return true;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-obsidian-200 border-l border-border-subtle z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-obsidian-200/95 backdrop-blur-md border-b border-border-hairline z-10">
              <div className="flex items-center justify-between px-8 py-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Project Intake</h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    Step {step} of 4
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="px-8 pb-6">
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        s <= step ? "bg-signal-cyan" : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="px-8 py-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-xl font-medium text-white mb-2">
                      Select Engagement Type
                    </h3>
                    <p className="text-zinc-400 mb-8">
                      Choose the service that best fits your needs
                    </p>

                    <div className="space-y-3">
                      {engagementTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSelectedEngagement(type.id)}
                          className={`w-full text-left p-6 rounded-2xl border transition-all duration-200 ${
                            selectedEngagement === type.id
                              ? "border-signal-cyan bg-signal-cyan/5"
                              : "border-border-hairline hover:border-border-subtle hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-lg font-medium text-white mb-1">
                                {type.label}
                              </h4>
                              <p className="text-sm text-zinc-400">{type.desc}</p>
                            </div>
                            {selectedEngagement === type.id && (
                              <div className="w-6 h-6 rounded-full bg-signal-cyan flex items-center justify-center flex-shrink-0">
                                <Check className="w-4 h-4 text-obsidian-200" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-xl font-medium text-white mb-2">
                      Budget Range
                    </h3>
                    <p className="text-zinc-400 mb-8">
                      Select your approximate project budget
                    </p>

                    <div className="space-y-3">
                      {budgetTiers.map((tier) => (
                        <button
                          key={tier.id}
                          onClick={() => setSelectedBudget(tier.id)}
                          className={`w-full text-left p-6 rounded-2xl border transition-all duration-200 ${
                            selectedBudget === tier.id
                              ? "border-signal-cyan bg-signal-cyan/5"
                              : "border-border-hairline hover:border-border-subtle hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-medium text-white">
                              {tier.label}
                            </h4>
                            {selectedBudget === tier.id && (
                              <div className="w-6 h-6 rounded-full bg-signal-cyan flex items-center justify-center">
                                <Check className="w-4 h-4 text-obsidian-200" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-xl font-medium text-white mb-2">
                      Client Details
                    </h3>
                    <p className="text-zinc-400 mb-8">
                      Tell us about yourself and your project
                    </p>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Your Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={clientDetails.name}
                          onChange={(e) => updateField("name", e.target.value)}
                          className={`w-full px-4 py-3 bg-obsidian-400 border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-signal-cyan/50 transition-all ${
                            errors.name ? "border-red-500" : "border-border-hairline"
                          }`}
                          placeholder="John Doe"
                        />
                        {errors.name && (
                          <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Company Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={clientDetails.company}
                          onChange={(e) => updateField("company", e.target.value)}
                          className={`w-full px-4 py-3 bg-obsidian-400 border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-signal-cyan/50 transition-all ${
                            errors.company ? "border-red-500" : "border-border-hairline"
                          }`}
                          placeholder="Acme Inc."
                        />
                        {errors.company && (
                          <p className="text-red-400 text-sm mt-1">{errors.company}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Email Address <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={clientDetails.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          className={`w-full px-4 py-3 bg-obsidian-400 border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-signal-cyan/50 transition-all ${
                            errors.email ? "border-red-500" : "border-border-hairline"
                          }`}
                          placeholder="john@acme.com"
                        />
                        {errors.email && (
                          <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Phone Number <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="tel"
                          value={clientDetails.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          className={`w-full px-4 py-3 bg-obsidian-400 border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-signal-cyan/50 transition-all ${
                            errors.phone ? "border-red-500" : "border-border-hairline"
                          }`}
                          placeholder="(555) 123-4567"
                        />
                        {errors.phone && (
                          <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Current Website URL
                        </label>
                        <input
                          type="url"
                          value={clientDetails.currentWebsite}
                          onChange={(e) => updateField("currentWebsite", e.target.value)}
                          className={`w-full px-4 py-3 bg-obsidian-400 border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-signal-cyan/50 transition-all ${
                            errors.currentWebsite ? "border-red-500" : "border-border-hairline"
                          }`}
                          placeholder="https://example.com"
                        />
                        {errors.currentWebsite && (
                          <p className="text-red-400 text-sm mt-1">{errors.currentWebsite}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Project Goals <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={clientDetails.projectGoals}
                          onChange={(e) => updateField("projectGoals", e.target.value)}
                          rows={5}
                          className={`w-full px-4 py-3 bg-obsidian-400 border rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-signal-cyan/50 transition-all resize-none ${
                            errors.projectGoals ? "border-red-500" : "border-border-hairline"
                          }`}
                          placeholder="Describe what you want to achieve with this project..."
                        />
                        <div className="flex items-center justify-between mt-1">
                          <div>
                            {errors.projectGoals && (
                              <p className="text-red-400 text-sm">{errors.projectGoals}</p>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500">
                            {clientDetails.projectGoals.length} / 20 min
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-signal-cyan/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check className="w-10 h-10 text-signal-cyan" />
                    </div>

                    <h3 className="text-2xl font-semibold text-white mb-3">
                      Submission Received
                    </h3>
                    <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                      Your project intake has been submitted successfully. We'll reach out within 24 hours to discuss next steps.
                    </p>

                    <div className="inline-block bg-obsidian-400 border border-border-subtle rounded-xl px-6 py-4 mb-8">
                      <p className="text-sm text-zinc-400 mb-1">Reference Number</p>
                      <p className="text-xl font-mono font-semibold text-signal-cyan">
                        {ticketRef}
                      </p>
                    </div>

                    <div className="space-y-3 text-left max-w-md mx-auto bg-obsidian-400/50 rounded-xl p-6 border border-border-hairline">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Engagement Type:</span>
                        <span className="text-white font-medium">
                          {engagementTypes.find((t) => t.id === selectedEngagement)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Budget Range:</span>
                        <span className="text-white font-medium">
                          {budgetTiers.find((t) => t.id === selectedBudget)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Company:</span>
                        <span className="text-white font-medium">
                          {clientDetails.company}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleClose}
                      className="mt-8 px-8 py-3 bg-signal-cyan text-obsidian-200 font-medium rounded-full hover:bg-signal-cyan/90 transition-colors"
                    >
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {step < 4 && (
              <div className="sticky bottom-0 bg-obsidian-200/95 backdrop-blur-md border-t border-border-hairline px-8 py-6">
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={handleBack}
                    disabled={step === 1}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border border-border-subtle text-zinc-400 hover:text-white hover:border-border-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-zinc-400 disabled:hover:border-border-subtle"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="flex items-center gap-2 px-8 py-3 bg-signal-cyan text-obsidian-200 font-medium rounded-full hover:bg-signal-cyan/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-signal-cyan"
                  >
                    {step === 3 ? "Submit" : "Continue"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
