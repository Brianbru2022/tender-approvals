// src/app/submit/page.tsx
"use client";

import { useState } from "react";
import { Decimal } from "decimal.js"; // <-- Import Decimal

// Define a type for the bid
type Bid = {
  id: string;
  contractor: string;
  quote: string;
};

// --- Reusable Form/Input Classes ---
const inputClasses =
  "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm";
const labelClasses = "block text-sm font-medium text-slate-700";
const buttonClasses =
  "rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2";
const cardClasses = "bg-white shadow-sm ring-1 ring-slate-900/5 rounded-md";
// ------------------------------------

export default function SubmitPage() {
  // --- Define State ---
  const [requesterEmail, setRequesterEmail] = useState("");
  const [site, setSite] = useState("");
  const [trade, setTrade] = useState("");
  const [tendersIssued, setTendersIssued] = useState(0);
  const [tendersReceived, setTendersReceived] = useState(0);
  const [budgetValue, setBudgetValue] = useState("0.00");
  const [estimatedProfit, setEstimatedProfit] = useState("0.00");

  const [bids, setBids] = useState<Bid[]>([
    { id: crypto.randomUUID(), contractor: "", quote: "0.00" },
  ]);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // --- Define Helper Functions ---
  const addBid = () => {
    setBids((prev) => [
      ...prev,
      { id: crypto.randomUUID(), contractor: "", quote: "0.00" },
    ]);
  };

  const removeBid = (id: string) => {
    setBids((prev) => prev.filter((b) => b.id !== id));
  };

  // Find the cheapest bid
  const cheapest =
    bids.length > 0
      ? bids.reduce((min, b) => {
          const minQuote = new Decimal(min.quote || 0);
          const currentQuote = new Decimal(b.quote || 0);
          return currentQuote.lt(minQuote) ? b : min;
        }, bids[0])
      : null;

  // Add your submit logic
  const submit = async () => {
    setSaving(true);
    setMessage("Submitting...");
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        body: JSON.stringify({
          requesterEmail,
          site,
          trade,
          tendersIssued,
          tendersReceived,
          budgetValue,
          estimatedProfit,
          bids,
          recommendedBidId: recommendedId, // <-- This line is now fixed
          comments,
        }),
      });
      if (res.ok) {
        setMessage("Submitted successfully! Redirecting...");
        // Redirect to approvals page after success
        setTimeout(() => {
          window.location.href = "/approvals";
        }, 2000);
      } else {
        const err = await res.json();
        console.error(err);
        setMessage(
          `Error: ${err.message || "Failed to submit."} (See console for details)`
        );
        setSaving(false);
      }
    } catch (e: any) {
      console.error(e);
      setMessage(`Error: ${e.message}`);
      setSaving(false);
    }
  };

  // --- Return JSX ---
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900">
        New Approval Request
      </h2>

      {/* --- Request Details Card --- */}
      <section className={`${cardClasses} p-6`}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="requesterEmail" className={labelClasses}>
              Your Email (for status updates)
            </label>
            <input
              type="email"
              id="requesterEmail"
              value={requesterEmail}
              onChange={(e) => setRequesterEmail(e.target.value)}
              className={inputClasses}
              placeholder="you@company.com"
            />
          </div>
          <div>{/* Spacer */}</div>
          <div>
            <label htmlFor="site" className={labelClasses}>
              Site
            </label>
            <input
              type="text"
              id="site"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className={inputClasses}
              placeholder="e.g., Project London"
            />
          </div>
          <div>
            <label htmlFor="trade" className={labelClasses}>
              Trade
            </label>
            <input
              type="text"
              id="trade"
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              className={inputClasses}
              placeholder="e.g., Groundworks"
            />
          </div>
          <div>
            <label htmlFor="tendersIssued" className={labelClasses}>
              Tenders Issued
            </label>
            <input
              type="number"
              id="tendersIssued"
              value={tendersIssued}
              onChange={(e) => setTendersIssued(parseInt(e.target.value) || 0)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="tendersReceived" className={labelClasses}>
              Tenders Received
            </label>
            <input
              type="number"
              id="tendersReceived"
              value={tendersReceived}
              onChange={(e) =>
                setTendersReceived(parseInt(e.target.value) || 0)
              }
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="budgetValue" className={labelClasses}>
              Budget Value
            </label>
            <input
              type="number"
              step="0.01"
              id="budgetValue"
              value={budgetValue}
              onChange={(e) => setBudgetValue(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="estimatedProfit" className={labelClasses}>
              Estimated Profit
            </label>
            <input
              type="number"
              step="0.01"
              id="estimatedProfit"
              value={estimatedProfit}
              onChange={(e) => setEstimatedProfit(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>
      </section>

      {/* --- Bids Card --- */}
      <section className={cardClasses}>
        <div className="flex items-center justify-between p-6">
          <h3 className="text-lg font-semibold">Bids</h3>
          <button onClick={addBid} className={buttonClasses}>
            + Add Bid
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Contractor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Quote (£)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Δ vs Cheapest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  % vs Cheapest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Recommend
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {bids.map((b, idx) => {
                const q = new Decimal(b.quote || 0);
                const cheapestQuote = new Decimal(cheapest?.quote || 0);
                const delta = cheapest ? q.minus(cheapestQuote) : new Decimal(0);
                const pct =
                  cheapest && cheapestQuote.gt(0)
                    ? delta.div(cheapestQuote).times(100)
                    : new Decimal(0);
                const isCheapest = cheapest && cheapest.id === b.id;

                return (
                  <tr
                    key={b.id}
                    className={isCheapest ? "bg-cyan-50" : undefined}
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <input
                        placeholder="Contractor name"
                        value={b.contractor}
                        onChange={(e) =>
                          setBids((prev) =>
                            prev.map((x) =>
                              x.id === b.id
                                ? { ...x, contractor: e.target.value }
                                : x
                            )
                          )
                        }
                        className={`${inputClasses} min-w-40`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <input
                        type="number"
                        step="0.01"
                        value={b.quote}
                        onChange={(e) =>
                          setBids((prev) =>
                            prev.map((x) =>
                              x.id === b.id
                                ? { ...x, quote: e.target.value }
                                : x
                            )
                          )
                        }
                        className={`${inputClasses} w-32`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {cheapest
                        ? delta.greaterThan(0)
                          ? `+${delta.toFixed(2)}`
                          : delta.toFixed(2)
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {cheapest ? `${pct.toFixed(2)}%` : "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <input
                        type="radio"
                        name="recommended"
                        className="h-4 w-4 text-slate-600 focus:ring-slate-500"
                        checked={recommendedId === b.id}
                        onChange={() => setRecommendedId(b.id)}
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {idx > 0 && ( // Prevent removing the last bid
                        <button
                          onClick={() => removeBid(b.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
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
      <section className={`${cardClasses} p-6`}>
        <label htmlFor="comments" className={labelClasses}>
          Comments (why recommended)
        </label>
        <textarea
          id="comments"
          rows={4}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className={inputClasses}
        />
      </section>

      {/* --- Submit --- */}
      <div className="flex items-center gap-4">
        <button onClick={submit} disabled={saving} className={buttonClasses}>
          {saving ? "Submitting..." : "Submit"}
        </button>
        {message && (
          <span
            className={`text-sm ${
              message.startsWith("Error")
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
}


