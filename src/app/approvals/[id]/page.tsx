// src/app/approvals/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Decimal } from "decimal.js";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { Status, ActionType, ApprovalAction, Bid } from "@prisma/client";

// --- STEP 1: You would import your "session" function from your auth provider ---
// import { getSession } from "next-auth/react"; // (This is an example)

// --- Reusable Classes ---
const cardClasses = "bg-white shadow-sm ring-1 ring-slate-900/5 rounded-md";
const labelClasses = "block text-sm font-medium text-slate-700";
const inputClasses =
  "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm";
// -----------------------------------------------------------------

/**
 * Helper component to display a "Label" and "Value" pair.
 */
function DetailItem({
  label,
  value,
  isCurrency = false,
}: {
  label: string;
  value: string | number | Decimal | null | undefined;
  isCurrency?: boolean;
}) {
  let displayValue = "-";
  if (value) {
    if (isCurrency) {
      // Use the no-decimal formatter
      displayValue = formatCurrency(value);
    } else {
      displayValue = value.toString();
    }
  }

  return (
    <div>
      <dt className={labelClasses}>{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-900">
        {displayValue}
      </dd>
    </div>
  );
}

/**
 * Helper component for the status badge
 */
function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/**
 * This component contains the Server Action to Approve/Reject
 */
async function ApprovalActionForm({
  approvalId,
  currentStatus,
}: {
  approvalId: string;
  currentStatus: Status;
}) {
  // --- BEGIN AUTHENTICATION CHECK (PSEUDO-CODE) ---
  // To make this work, you must install and configure an auth system like NextAuth.js
  /*
  // STEP 2: Get the logged-in user's session
  const session = await getSession(); // This function comes from your auth provider
  const approverEmail = process.env.APPROVER_EMAIL;

  // STEP 3: Check if the user is the designated approver
  const isApprover = session?.user?.email === approverEmail;

  // STEP 4: If not an approver, show a message and stop
  if (!isApprover) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md ring-1 ring-yellow-200">
        <p className="font-medium text-yellow-800">
          You are not authorized to take action on this request.
        </p>
      </div>
    );
  }
  */
  // --- END AUTHENTICATION CHECK ---

  // This is the Server Action
  async function submitAction(formData: FormData) {
    "use server";

    const action = formData.get("action");
    const notes = formData.get("notes") as string;
    
    // This is where you would get the logged-in user's email
    // const session = await getSession();
    // const actorEmail = session?.user?.email || "unknown@example.com";
    
    // For now, we'll hardcode it as the approver
    const actorEmail = process.env.APPROVER_EMAIL || "approver@example.com";

    if (!action || (action !== "APPROVE" && action !== "REJECT")) {
      throw new Error("Invalid action");
    }

    const newStatus: Status = action === "APPROVE" ? "APPROVED" : "REJECTED";

    try {
      await prisma.$transaction([
        prisma.approvalRequest.update({
          where: { id: approvalId },
          data: { status: newStatus },
        }),
        prisma.approvalAction.create({
          data: {
            approvalRequestId: approvalId,
            actorEmail: actorEmail,
            action: action as ActionType,
            notes: notes || null,
          },
        }),
      ]);

      revalidatePath(`/approvals/${approvalId}`);
      redirect("/approvals");
    } catch (e: any) {
      console.error(e);
      throw new Error("Failed to process action: " + e.message);
    }
  }

  // If not pending, don't show the form
  if (currentStatus !== "PENDING") {
    return null;
  }

  // This form is only visible if the "PENDING" check passes
  // and the (commented out) "isApprover" check also passes.
  return (
    <section className={`${cardClasses} p-6`}>
      <h3 className="text-lg font-semibold">Take Action</h3>
      <form action={submitAction} className="mt-4 space-y-4">
        <div>
          <label htmlFor="notes" className={labelClasses}>
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className={`${inputClasses} px-3 py-2`}
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            name="action"
            value="APPROVE"
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
          >
            Approve
          </button>
          <button
            type="submit"
            name="action"
            value="REJECT"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      </form>
    </section>
  );
}

/**
 * The main page component for viewing a single approval.
 */
export default async function ApprovalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const approval = await prisma.approvalRequest.findUnique({
    where: { id: params.id },
    include: {
      bids: { orderBy: { quote: "asc" } }, // Order bids by quote
      actions: { orderBy: { createdAt: "desc" } }, // Show newest actions first
    },
  });

  if (!approval) {
    notFound();
  }
  
  // We need to use Decimal for all bids to do calculations
  const bidsWithDecimal = approval.bids.map(b => ({
    ...b,
    quote: new Decimal(b.quote)
  }));

  // Find the cheapest bid
  const cheapest =
    bidsWithDecimal.length > 0
      ? bidsWithDecimal.reduce((min, b) => (b.quote.lt(min.quote) ? b : min))
      : null;

  // Find the recommended bid
  const recommendedBid = approval.recommendedBidId
    ? bidsWithDecimal.find((b) => b.id === approval.recommendedBidId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/approvals"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            &larr; Back to all approvals
          </Link>
          <h2 className="text-xl font-semibold text-slate-900">
            Approval Details
          </h2>
        </div>
        <StatusBadge status={approval.status} />
      </div>

      {/* --- Action Form (shows only if PENDING & user is an approver) --- */}
      <ApprovalActionForm
        approvalId={approval.id}
        currentStatus={approval.status}
      />

      {/* --- Request Details Card --- */}
      <section className={`${cardClasses} p-6`}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3">
          <DetailItem label="Site" value={approval.site} />
          <DetailItem label="Trade" value={approval.trade} />
          <DetailItem
            label="Budget Value"
            value={approval.budgetValue}
            isCurrency
          />
          <DetailItem
            label="Estimated Profit"
            value={approval.estimatedProfit}
            isCurrency
          />
          <DetailItem label="Tenders Issued" value={approval.tendersIssued} />
          <DetailItem
            label="Tenders Received"
            value={approval.tendersReceived}
          />
          <DetailItem
            label="Requester Email"
            value={approval.requesterEmail}
          />
          <DetailItem
            label="Submitted"
            value={approval.createdAt.toLocaleString()}
          />
        </dl>
      </section>

      {/* --- Bids Card --- */}
      <section className={cardClasses}>
        <div className="p-6">
          <h3 className="text-lg font-semibold">Bids</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Contractor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Quote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Δ vs Cheapest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  % vs Cheapest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {bidsWithDecimal.map((b) => {
                const cheapestQuote = new Decimal(cheapest?.quote || 0);
                const delta = cheapest ? b.quote.minus(cheapestQuote) : new Decimal(0);
                const pct =
                  cheapest && cheapestQuote.gt(0) && b.quote.gt(0)
                    ? b.quote.minus(cheapestQuote).div(cheapestQuote).times(100)
                    : new Decimal(0);
                
                const isCheapest = cheapest && cheapest.id === b.id;
                const isRecommended = recommendedBid && recommendedBid.id === b.id;

                let rowClass = "";
                if (isRecommended) rowClass = "bg-green-50"; // <-- Green for recommended
                else if (isCheapest) rowClass = "bg-cyan-50";

                return (
                  <tr key={b.id} className={rowClass}>
                    <td className="whitespace-nowrap px-6 py-4 font-medium">
                      {b.contractor}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {formatCurrency(b.quote)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {cheapest
                        ? delta.greaterThan(0)
                          ? `+${formatCurrency(delta)}`
                          : formatCurrency(delta)
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {cheapest ? `${pct.toFixed(2)}%` : "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {isRecommended && (
                        <span className="rounded-full bg-green-200 px-2 py-0.5 text-xs font-medium text-green-800">
                          Recommended
                        </span>
                      )}
                      {isCheapest && !isRecommended && (
                        <span className="rounded-full bg-cyan-200 px-2 py-0.5 text-xs font-medium text-cyan-800">
                          Cheapest
                        </span>
                      )}
                    </td>
                  </tr>
                );
})}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- Comments Card --- */}
      {approval.comments && (
        <section className={`${cardClasses} p-6`}>
          <h3 className="text-lg font-semibold">Requester's Comments</h3>
          <p className="mt-2 whitespace-pre-wrap text-slate-700">
            {approval.comments}
          </p>
        </section>
      )}

      {/* --- History Card --- */}
      {approval.actions.length > 0 && (
        <section className={`${cardClasses} p-6`}>
          <h3 className="text-lg font-semibold">History</h3>
          <ul className="mt-4 divide-y divide-slate-200">
            {approval.actions.map((action: ApprovalAction) => (
              <li key={action.id} className="py-3">
                <p className="font-medium">
                  {action.action} by {action.actorEmail}
                </p>
                <p className="text-sm text-slate-500">
                  {action.createdAt.toLocaleString()}
                </p>
                {action.notes && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {action.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// --- Helper to format currency (no decimals) ---
function formatCurrency(value: Decimal | number | string) {
  const num = new Decimal(value || 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num.toNumber());
}