import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Decimal } from "decimal.js";
import type { Bid } from "@prisma/client";

// --- 1. Import Auth functions ---
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { hasRole } from "@/lib/users";

// --- (Zod Schemas are unchanged) ---
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
  requesterEmail: z.string().email(), // We will validate this against the session
  recommendedBidId: z.string().optional().nullable(),
  bids: z.array(BidSchema).min(1),
});

export async function POST(req: Request) {
  // --- 2. Add Authentication Check ---
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return new NextResponse("Not authenticated", { status: 401 });
  }

  // @ts-ignore - We know roles are on the session
  const userRoles = session.user.roles || [];
  if (!hasRole(userRoles, "SUBMITTER")) {
    return new NextResponse("Forbidden: You do not have permission to submit.", {
      status: 403,
    });
  }
  // --- End Auth Check ---

  try {
    const data = await req.json();
    const parsed = CreateSchema.parse(data);

    // --- 3. Extra Security: Validate email ---
    // Ensure the email in the form matches the logged-in user
    if (parsed.requesterEmail !== session.user.email) {
      return new NextResponse(
        "Forbidden: Requester email does not match logged-in user.",
        { status: 403 }
      );
    }
    // ------------------------------------------

    const created = await prisma.approvalRequest.create({
      data: {
        site: parsed.site,
        trade: parsed.trade,
        tendersIssued: parsed.tendersIssued,
        tendersReceived: parsed.tendersReceived,
        budgetValue: parsed.budgetValue,
        estimatedProfit: parsed.estimatedProfit,
        comments: parsed.comments,
        requesterEmail: parsed.requesterEmail, // This is now secure
        bids: {
          create: parsed.bids.map((b) => ({
            contractor: b.contractor,
            quote: b.quote,
          })),
        },
      },
      include: { bids: true },
    });

    // (This part for attaching the recommended bid is unchanged)
    const dbBids = created.bids as (Bid & { quote: Decimal })[];
    if (parsed.recommendedBidId) {
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

    // --- 4. ALL EMAIL CODE IS REMOVED ---
    // (No more sendMail, no more 'cheapest' calculation, no more mailer import)
    // ------------------------------------

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