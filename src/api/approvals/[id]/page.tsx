// src/app/approvals/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation"; // <-- Import redirect
import { Decimal } from "decimal.js";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { Status, ActionType, ApprovalAction, Bid } from "@prisma/client";
import { getServerSession } from "next-auth/next"; // <-- Import getServerSession
import { authOptions } from "../../api/auth/[...nextauth]/route"; // <-- Import authOptions
import { hasRole } from "@/lib/users"; // <-- Import hasRole

// --- (Reusable Classes are the same) ---
const cardClasses = "bg-white shadow-sm ring-1 ring-slate-900/5 rounded-md";
const labelClasses = "block text-sm font-medium text-slate-700";
const inputClasses =
  "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm px-3 py-2";
// --------------------------------------

// --- (DetailItem and StatusBadge components are the same) ---
function DetailItem(/* ... */) { /* ... */ }
function StatusBadge(/* ... */) { /* ... */ }
// -----------------------------------------------------------

/**
 * This component contains the Server Action to Approve/Reject
 */
async function ApprovalActionForm({
  approvalId,
  currentStatus,
  userRoles, // <-- Receive user roles
}: {
  approvalId: string;
  currentStatus: Status;
  userRoles: string[]; // <-- Type for user roles
}) {
  // --- BEGIN ACTUAL AUTHENTICATION CHECK ---
  // Check if the user has the 'APPROVER' role
  const isApprover = hasRole(userRoles, "APPROVER");

  // If not an approver, show a message and stop
  if (!isApprover) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md ring-1 ring-yellow-200">
        <p className="font-medium text-yellow-800">
          You are not authorized to take action on this request.
        </p>
      </div>
    );
  }
  // --- END AUTHENTICATION CHECK ---

  // Server Action (remains mostly the same, gets actorEmail from session)
  async function submitAction(formData: FormData) {
    "use server";

    // --- Get actor email from session ---
    const session = await getServerSession(authOptions);
    const actorEmail = session?.user?.email || "unknown@system.com";
    // ------------------------------------

    const action = formData.get("action");
    const notes = formData.get("notes") as string;

    if (!action || (action !== "APPROVE" && action !== "REJECT")) {
      throw new Error("Invalid action");
    }
    const newStatus: Status = action === "APPROVE" ? "APPROVED" : "REJECTED";

    try {
      await prisma.$transaction([
        prisma.approvalRequest.update({ /* ... */ }),
        prisma.approvalAction.create({
          data: {
            approvalRequestId: approvalId,
            actorEmail: actorEmail, // <-- Use email from session
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

  if (currentStatus !== "PENDING") {
    return null;
  }

  // Render the form only if status is PENDING and user is APPROVER
  return (
    <section className={`${cardClasses} p-6`}>
      <h3 className="text-lg font-semibold">Take Action</h3>
      <form action={submitAction} className="mt-4 space-y-4">
        {/* ... (form content is the same) ... */}
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
  // --- Get session and check login ---
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/login?callbackUrl=/approvals/${params.id}`);
  }
  // ------------------------------------

  const approval = await prisma.approvalRequest.findUnique({ /* ... */ });
  if (!approval) {
    notFound();
  }
  
  // --- Get user roles from session ---
  // @ts-ignore - We added 'roles' in our custom NextAuth callback
  const userRoles = session?.user?.roles || [];
  // ---------------------------------

  const bidsWithDecimal = approval.bids.map(b => ({ /* ... */ }));
  const cheapest = bidsWithDecimal.length > 0 ? bidsWithDecimal.reduce(/* ... */) : null;
  const recommendedBid = approval.recommendedBidId ? bidsWithDecimal.find(/* ... */) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         {/* ... (header content is the same) ... */}
      </div>

      {/* --- Action Form (Pass userRoles down) --- */}
      <ApprovalActionForm
        approvalId={approval.id}
        currentStatus={approval.status}
        userRoles={userRoles} // <-- Pass roles here
      />
      {/* ------------------------------------------- */}

      {/* ... (rest of the page is the same: Details, Bids, Comments, History cards) ... */}
    </div>
  );
}

// --- (Helper formatCurrency function is the same) ---
function formatCurrency(value: Decimal | number | string) { /* ... */ }

// --- Need to copy DetailItem and StatusBadge components here ---
// (I've omitted them for brevity, but they are the same as your last file)

// --- Need to copy the form content for ApprovalActionForm ---
// (I've omitted it for brevity, but it is the same as your last file)

// --- Need to copy the content for the details, bids, comments, history cards ---
// (I've omitted them for brevity, but they are the same as your last file)