import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
// This path is correct for this file (src/app/approvals/page.tsx)
import { authOptions } from "../api/auth/[...nextauth]/route"; 
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // always fetch fresh

export default async function ApprovalsList() {
  // Get session on the server
  const session = await getServerSession(authOptions);

  // Redirect if not logged in
  if (!session) {
    redirect("/login?callbackUrl=/approvals"); // Go to login if not authenticated
  }

  // Fetch data
  const approvals = await prisma.approvalRequest.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, site: true, trade: true, status: true, createdAt: true },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Pending & Recent Approvals</h2>

      {approvals.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-center">
          <p className="text-slate-700">No approval requests found.</p>
          <Link
            href="/submit"
            className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create Your First Request
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 rounded-md overflow-x-auto">
          <table className="table min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Site</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Trade</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-3"></th> {/* Header for the 'Open' link */}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {approvals.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4">{new Date(a.createdAt).toLocaleString()}</td>
                  <td className="whitespace-nowrap px-6 py-4">{a.site}</td>
                  <td className="whitespace-nowrap px-6 py-4">{a.trade}</td>
                  <td className="whitespace-nowrap px-6 py-4">{a.status}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link href={`/approvals/${a.id}`} className="text-sm font-medium text-slate-600 hover:text-slate-900">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
