import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic"; // always fetch fresh

export default async function ApprovalsList() {
  const approvals = await prisma.approvalRequest.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, site: true, trade: true, status: true, createdAt: true },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Pending & Recent Approvals</h2>

      {/* --- This is the new logic --- */}
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
        <table className="table">
          <thead>
            <tr>
              <th>Created</th>
              <th>Site</th>
              <th>Trade</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.createdAt).toLocaleString()}</td>
                <td>{a.site}</td>
                <td>{a.trade}</td>
                <td>{a.status}</td>
                <td>
                  <Link href={`/approvals/${a.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

