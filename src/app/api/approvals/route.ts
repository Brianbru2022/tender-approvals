// src/app/api/approvals/route.ts

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Decimal } from "decimal.js";
import type { Bid } from "@prisma/client";

// ... (The Zod schemas are all correct) ...
const BidSchema = z.object({
  id: z.string(),
  contractor: z.string().min(1),
  quote: z.string(),
});

const CreateSchema = z.object({
  site: z.string().min(1),
  trade: z.string().min(1),
  tendersIssued: z.number().int().nonnegative(),
  tendersReceived: z.number().int().nonnegative(),
  budgetValue: z.string(),
  estimatedProfit: z.string(),
  comments: z.string().optional(),
  requesterEmail: z.string().email(),
  recommendedBidId: z.string().optional().nullable(),
  bids: z.array(BidSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const parsed = CreateSchema.parse(data);

    const created = await prisma.approvalRequest.create({
      // ... (This data block is correct) ...
      data: {
        site: parsed.site,
        trade: parsed.trade,
        tendersIssued: parsed.tendersIssued,
        tendersReceived: parsed.tendersReceived,
        budgetValue: parsed.budgetValue,
        estimatedProfit: parsed.estimatedProfit,
        comments: parsed.comments,
        requesterEmail: parsed.requesterEmail,
        bids: {
          create: parsed.bids.map((b) => ({
            contractor: b.contractor,
            quote: b.quote,
          })),
        },
      },
      include: { bids: true },
    });

    const dbBids = created.bids as (Bid & { quote: Decimal })[];

    if (parsed.recommendedBidId) {
      // ... (This logic for attaching the bid is correct) ...
      const clientRecBid = parsed.bids.find(
        (b) => b.id === parsed.recommendedBidId
      );
      const match = clientRecBid
        ? dbBids.find(
            (b) =>
              b.contractor === clientRecBid.contractor &&
              b.quote.toString() === clientRecBid.quote
          )
        : null;
      if (match) {
        await prisma.approvalRequest.update({
          where: { id: created.id },
          data: { recommendedBidId: match.id },
        });
      }
    }

    // --- All email logic is below ---
    const { sendMail } = await import("@/lib/mailer");
    const base = process.env.APP_BASE_URL ?? "http://localhost:3000";

    // --- (1) NEW: Send confirmation to the REQUESTER ---
    await sendMail(
      created.requesterEmail, // Send to the person who filled out the form
      `Submission Received – ${created.site} / ${created.trade}`,
      `<p>Your approval request has been submitted successfully.</p>
       <p><b>Site:</b> ${created.site}<br/>
       <b>Trade:</b> ${created.trade}<br/>
       <b>Status:</b> PENDING</p>
       <p>You will receive another email once your request has been approved or rejected.</p>`
    );
    // ---------------------------------------------------

    // --- (2) Send email to the APPROVER ---
    const approver = process.env.APPROVER_EMAIL!;
    const link = `${base}/approvals/${created.id}`;

    if (dbBids.length === 0) {
      throw new Error("No bids were created to determine the cheapest.");
    }
    const cheapest = dbBids.reduce((min, b) =>
      b.quote.lt(min.quote) ? b : min
    );

    await sendMail(
      approver,
      `Approval Request – ${created.site} / ${created.trade}`,
      `<p>You have a new subcontract approval to review.</p>
       <p><b>Site:</b> ${created.site}<br/>
       <b>Trade:</b> ${created.trade}<br/>
       <b>Bids:</b> ${created.bids.length} (cheapest ${formatCurrency(cheapest.quote)})</p>
       <p><a href="${link}">Open approval</a></p>`
    );
    // ------------------------------------------

    return NextResponse.json({ id: created.id });
  } catch (e: any) {
    console.error(e);
    if (e && typeof e === "object" && e.errors && Array.isArray(e.errors)) {
      return NextResponse.json(
        { message: "Validation failed", errors: e.errors },
        { status: 400 }
      );
    }
    if (e instanceof Error) {
      return new NextResponse(e.message, { status: 400 });
    }
    return new NextResponse("An unknown error occurred", { status: 400 });
  }
}

// --- NEW HELPER: We need to format the currency for the email ---
function formatCurrency(value: Decimal | number | string) {
  const num = new Decimal(value || 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num.toNumber());
}