import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Decimal } from "decimal.js"; // <-- EXPLICIT IMPORT
import type { Bid } from "@prisma/client"; // <-- EXPLICIT IMPORT

// --- Define the Bid schema for validation ---
const BidSchema = z.object({
  id: z.string(), // Client-side ID
  contractor: z.string().min(1),
  quote: z.string(), // Keep as string for Decimal
});
// ------------------------------------------

const CreateSchema = z.object({
  site: z.string().min(1),
  trade: z.string().min(1),
  tendersIssued: z.number().int().nonnegative(),
  tendersReceived: z.number().int().nonnegative(),
  budgetValue: z.string(),
  estimatedProfit: z.string(),
  comments: z.string().optional(),
  requesterEmail: z.string().email(),
  recommendedBidId: z.string().optional().nullable(), // This is the client-side ID
  bids: z.array(BidSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const parsed = CreateSchema.parse(data);

    const created = await prisma.approvalRequest.create({
      data: {
        site: parsed.site,
        trade: parsed.trade,
        tendersIssued: parsed.tendersIssued,
        tendersReceived: parsed.tendersReceived,
        // Prisma's Decimal type correctly handles string input
        budgetValue: parsed.budgetValue,
        estimatedProfit: parsed.estimatedProfit,
        comments: parsed.comments,
        requesterEmail: parsed.requesterEmail,
        // Prisma's create relation also handles string for Decimal
        bids: {
          create: parsed.bids.map((b) => ({
            contractor: b.contractor,
            quote: b.quote,
          })),
        },
      },
      include: { bids: true }, // This ensures created.bids is populated
    });

    // --- MAIN FIX: Type assertion to help TypeScript ---
    // This tells TypeScript that `created.bids` is an array where `quote`
    // is a Decimal.js object, not a plain string.
    const dbBids = created.bids as (Bid & { quote: Decimal })[];

    // Attach recommended bid if provided and valid
    if (parsed.recommendedBidId) {
      const clientRecBid = parsed.bids.find(
        (b) => b.id === parsed.recommendedBidId
      );

      const match = clientRecBid
        ? dbBids.find(
            (b) =>
              b.contractor === clientRecBid.contractor &&
              b.quote.toString() === clientRecBid.quote // Now TS knows b.quote has .toString()
          )
        : null;

      if (match) {
        await prisma.approvalRequest.update({
          where: { id: created.id },
          data: { recommendedBidId: match.id },
        });
      }
    }

    // send email to approver with deep link
    const { sendMail } = await import("@/lib/mailer");
    const approver = process.env.APPROVER_EMAIL!;
    const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
    const link = `${base}/approvals/${created.id}`;

    // Find cheapest bid
    if (dbBids.length === 0) {
      // This should be prevented by Zod's .min(1), but it's good practice
      throw new Error("No bids were created to determine the cheapest.");
    }

    const cheapest = dbBids.reduce((min, b) =>
      b.quote.lt(min.quote) ? b : min
    ); // Now TS knows .lt() exists

    await sendMail(
      approver,
      `Approval Request – ${created.site} / ${created.trade}`,
      `<p>You have a new subcontract approval to review.</p>
<p><b>Site:</b> ${created.site}<br/>
<b>Trade:</b> ${created.trade}<br/>
<b>Bids:</b> ${created.bids.length} (cheapest £${cheapest.quote.toFixed(2)})</p>
<p><a href="${link}">Open approval</a></p>`
    );

    return NextResponse.json({ id: created.id });
  } catch (e: any) {
    console.error(e);

    // --- ALTERNATIVE CHECK ---
    // Check if 'e' *looks* like a Zod error by checking for the .errors property.
    // This avoids 'instanceof' issues which can be caused by duplicate packages.
    if (e && typeof e === "object" && e.errors && Array.isArray(e.errors)) {
      return NextResponse.json(
        { message: "Validation failed", errors: e.errors },
        { status: 400 }
      );
    }

    // Check if it's a standard error
    if (e instanceof Error) {
      return new NextResponse(e.message, { status: 400 });
    }

    // Fallback for any other type of error
    return new NextResponse("An unknown error occurred", { status: 400 });
  }
}

