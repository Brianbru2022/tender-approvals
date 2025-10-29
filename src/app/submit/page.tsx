// src/app/submit/page.tsx
"use client";

import { useState } from "react";
import { Decimal } from "decimal.js";

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

// --- Helper to format currency (no decimals) ---
const formatCurrency = (value: Decimal | number | string) => {
  const num = new Decimal(value || 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num.toNumber());
};
// --------------------------------------------------------

export default function SubmitPage() {
  // --- Define State ---
  const [requesterEmail, setRequesterEmail] = useState("");
  const [site, setSite] = useState("");
  const [trade, setTrade] = useState("");
  const [tendersIssued, setTendersIssued] = useState(0);
  const [tendersReceived, setTendersReceived] = useState(0);
  const [budgetValue, setBudgetValue] = useState("0");
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

  // --- Find the cheapest valid bid (ignore 0.00 quotes) ---
  const validBids = bids.filter((b) => new Decimal(b.quote || 0).gt(0));
  const cheapest =
    validBids.length > 0
      ? validBids.reduce((min, b) => {
          const minQuote = new Decimal(min.quote || 0);
          const currentQuote = new Decimal(b.quote || 0);
          return currentQuote.lt(minQuote) ? b : min;
        }, validBids[0])
      : null;

  // --- Calculate Estimated Profit ---
  const recommendedBid = bids.find((b) => b.id === recommendedId);
  const budgetDecimal = new Decimal(budgetValue || 0);

  let estimatedProfit: Decimal;
  if (recommendedBid) {
    const recommendedQuoteDecimal = new Decimal(recommendedBid.quote || 0);
    estimatedProfit = budgetDecimal.minus(recommendedQuoteDecimal);
  } else {
    estimatedProfit = new Decimal(0);
  }

  // --- Submit Logic ---
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
          estimatedProfit: estimatedProfit.toString(),
          bids,
          recommendedBidId: recommendedId,
          comments,
        }),
      });
      if (res.ok) {
        setMessage("Submitted successfully! Redirecting...");
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
              className={`${inputClasses} px-3 py-2`}
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
              className={`${inputClasses} px-3 py-2`}
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
              className={`${inputClasses} px-3 py-2`}
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
              className={`${inputClasses} px-3 py-2`}
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
              className={`${inputClasses} px-3 py-2`}
            />
          </div>

          <div>
            <label htmlFor="budgetValue" className={labelClasses}>
              Budget Value
            </label>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                £
              </span>
              <input
                type="number"
                step="1"
                id="budgetValue"
                value={budgetValue}
                onChange={(e) => setBudgetValue(e.target.value)}
                className={`${inputClasses} py-2 pl-7 pr-3`}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Estimated Profit (Calculated)</label>
            <div className="mt-1 block w-full rounded-md sm:text-lg font-semibold text-slate-900 h-10 flex items-center px-3 border border-slate-300 bg-slate-50">
              {formatCurrency(estimatedProfit)}
            </div>
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
                  Quote
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
              {bids.map((b) => {
                const q = new Decimal(b.quote || 0);
                const cheapestQuote = new Decimal(cheapest?.quote || 0);
                const delta = cheapest ? q.minus(cheapestQuote) : new Decimal(0);
                const pct =
                  cheapest && cheapestQuote.gt(0) && q.gt(0)
                    ? q.minus(cheapestQuote).div(cheapestQuote).times(100)
                    : new Decimal(0);
                
                // --- MODIFIED: Highlight logic ---
                const isCheapest = cheapest && cheapest.id === b.id;
                const isRecommended = recommendedId === b.id;

                const rowClass = isRecommended
                  ? "bg-green-50" // <-- Green for recommended
                  : isCheapest
                  ? "bg-cyan-50" // <-- Cyan for cheapest
                  : undefined;
                // ---------------------------------

                return (
                  <tr key={b.id} className={rowClass}>
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
                        className={`${inputClasses} min-w-40 px-3 py-2`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="relative mt-1">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                          £
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={b.quote}
                          className={`${inputClasses} w-32 py-2 pl-7 pr-3`}
                          onChange={(e) => {
                            const newQuote = e.target.value;
                            setBids((prev) => {
                              const updatedBids = prev.map((x) =>
                                x.id === b.id ? { ...x, quote: newQuote } : x
                              );
                              updatedBids.sort((a, b) => {
                                const quoteA = new Decimal(a.quote || 0);
                                const quoteB = new Decimal(b.quote || 0);
                                if (quoteA.isZero() && !quoteB.isZero()) return 1;
                                if (!quoteA.isZero() && quoteB.isZero()) return -1;
                                return quoteA.cmp(quoteB);
                              });
                              return updatedBids;
                            });
                          }}
                        />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {cheapest && q.gt(0)
                        ? delta.greaterThan(0)
                          ? `+${formatCurrency(delta)}`
                          : formatCurrency(delta)
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {cheapest && q.gt(0) ? `${pct.toFixed(2)}%` : "-"}
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
                      {bids.length > 1 && (
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
          className={`${inputClasses} px-3 py-2`}
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