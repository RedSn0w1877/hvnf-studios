import { NextRequest, NextResponse } from "next/server";
import { intakeFormSchema } from "@/lib/validations";
import { ZodError } from "zod";

/**
 * Generate unique ticket reference for intake submission
 * Format: HVNF-TK-XXXX (X = random digit)
 */
function generateTicketReference(): string {
  const randomId = Math.floor(1000 + Math.random() * 9000);
  return `HVNF-TK-${randomId}`;
}

/**
 * POST /api/intake
 * Handles client intake form submission
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate incoming data against schema
    const validatedData = intakeFormSchema.parse(body);

    // Generate ticket reference
    const ticketRef = generateTicketReference();

    // Structure email payload for Resend
    const emailPayload = {
      to: process.env.STUDIO_EMAIL || "intake@hvnfstudios.com",
      from: "HVNF Studios Intake <noreply@hvnfstudios.com>",
      replyTo: validatedData.email,
      subject: `New Intake: ${validatedData.businessName} [${ticketRef}]`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #09090b; border-bottom: 2px solid #e4e4e7; padding-bottom: 12px;">
            New Client Intake Submission
          </h1>

          <div style="background: #fafafa; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #71717a;">Ticket Reference</p>
            <p style="margin: 4px 0 0; font-size: 20px; font-weight: 600; color: #09090b;">${ticketRef}</p>
          </div>

          <h2 style="font-size: 16px; color: #09090b; margin-top: 24px;">Business Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 0; color: #71717a; width: 140px;">Business Name</td>
              <td style="padding: 8px 0; color: #09090b; font-weight: 500;">${validatedData.businessName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 0; color: #71717a;">Industry</td>
              <td style="padding: 8px 0; color: #09090b;">${validatedData.industry}</td>
            </tr>
            ${validatedData.website ? `
            <tr style="border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 0; color: #71717a;">Current Website</td>
              <td style="padding: 8px 0;"><a href="${validatedData.website}" style="color: #2563eb;">${validatedData.website}</a></td>
            </tr>
            ` : ''}
          </table>

          <h2 style="font-size: 16px; color: #09090b; margin-top: 24px;">Contact Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 0; color: #71717a; width: 140px;">Contact Name</td>
              <td style="padding: 8px 0; color: #09090b; font-weight: 500;">${validatedData.contactName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 0; color: #71717a;">Email</td>
              <td style="padding: 8px 0;"><a href="mailto:${validatedData.email}" style="color: #2563eb;">${validatedData.email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 0; color: #71717a;">Phone</td>
              <td style="padding: 8px 0;"><a href="tel:${validatedData.phone}" style="color: #2563eb;">${validatedData.phone}</a></td>
            </tr>
          </table>

          <h2 style="font-size: 16px; color: #09090b; margin-top: 24px;">Project Scope</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 0; color: #71717a; width: 140px;">Engagement Type</td>
              <td style="padding: 8px 0; color: #09090b; font-weight: 500;">${validatedData.engagementType}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 0; color: #71717a;">Budget Tier</td>
              <td style="padding: 8px 0; color: #09090b;">${validatedData.budgetTier}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 8px 0; color: #71717a;">Timeline</td>
              <td style="padding: 8px 0; color: #09090b;">${validatedData.timeline}</td>
            </tr>
          </table>

          <h2 style="font-size: 16px; color: #09090b; margin-top: 24px;">Current Challenges</h2>
          <p style="color: #3f3f46; line-height: 1.6; white-space: pre-wrap;">${validatedData.currentChallenges}</p>

          <h2 style="font-size: 16px; color: #09090b; margin-top: 24px;">Goals</h2>
          <p style="color: #3f3f46; line-height: 1.6; white-space: pre-wrap;">${validatedData.goals}</p>

          ${validatedData.competitorSites ? `
          <h2 style="font-size: 16px; color: #09090b; margin-top: 24px;">Competitor/Inspiration Sites</h2>
          <p style="color: #3f3f46; line-height: 1.6; white-space: pre-wrap;">${validatedData.competitorSites}</p>
          ` : ''}

          ${validatedData.referralSource ? `
          <div style="margin-top: 24px; padding: 12px; background: #fafafa; border-radius: 6px;">
            <span style="color: #71717a; font-size: 14px;">Referral Source:</span>
            <span style="color: #09090b; font-weight: 500; margin-left: 8px;">${validatedData.referralSource}</span>
          </div>
          ` : ''}

          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e4e4e7; color: #71717a; font-size: 12px;">
            <p>Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</p>
          </div>
        </div>
      `,
    };

    // TODO: Integrate Resend SDK to actually send email
    // await resend.emails.send(emailPayload);

    // Return success response with ticket reference
    return NextResponse.json(
      {
        success: true,
        ticketReference: ticketRef,
        message: "Intake submitted successfully. We'll reach out within 24 hours.",
      },
      { status: 200 }
    );

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          issues: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON payload",
        },
        { status: 400 }
      );
    }

    // Generic server error
    console.error("Intake API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error. Please try again.",
      },
      { status: 500 }
    );
  }
}
