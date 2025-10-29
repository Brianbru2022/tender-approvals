"use client";

import { useState } from "react";
import { Decimal } from "decimal.js";

type Bid = {
  id: string;
  contractor: string;
  quote: string;
};

export default function SubmitPage() {
  // --- Define State ---
  const [requesterEmail, setRequesterEmail] = useState("");
  const [site, setSite] = useState(""); 
  const [trade, setTrade] = useState("");
  // ... (you'll need to add state for budgetValue, tendersIssued, etc.)
  const [bids, setBids] = useState<Bid[]>([
    { id: crypto.randomUUID(), contractor: "", quote: "0.00" }
  ]);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // --- Define Helper Functions ---
  const addBid = () => {
    setBids(prev => [
      ...prev,
      { id: crypto.randomUUID(), contractor: "", quote: "0.00" }
    ]);
  };

  const removeBid = (id: string) => {
    setBids(prev => prev.filter(b => b.id !== id));
  };
  
  const cheapest = bids.length > 0
    ? bids.reduce((min, b) => {
        const minQuote = new Decimal(min.quote || 0);
        const currentQuote = new Decimal(b.quote || 0);
        return currentQuote.lt(minQuote) ? b : min;
      }, bids[0])
    : null;
    
  const submit = async () => {
    setSaving(true);
    setMessage("Submitting...");
    // This is where you would POST to /api/approvals
    // You need to collect all the form data (site, trade, budget, etc.)
    console.log("Submitting not implemented yet");
    // setSaving(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">New Approval Request</h2>
      
      {/* NOTE: You are missing inputs for many required fields
        like Site, Trade, Budget, etc. You need to add them here.
      */}
      <div>
        <label>Site</label>
        <input type="text" value={site} onChange={e => setSite(e.target.value)} />
      </div>
      <div>
        <label>Trade</label>
        <input type="text" value={trade} onChange={e => setTrade(e.target.value)} />
      </div>

      <div>
        <label>Your Email (for status updates)</label>
        <input type="email" value={requesterEmail} onChange={e => setRequesterEmail(e.target.value)} />
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Bids</h3>
          <button onClick={addBid}>+ Add Bid</button>
        </div>
        <table className="table mt-2">
          <thead>
            <tr>
              <th>Contractor</th>
              <th>Quote</th>
              <th>Δ vs Cheapest</th>
              <th>% vs Cheapest</th>
              <th>Recommend</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bids.map((b, idx) => {
              const q = new Decimal(b.quote || 0);
              const cheapestQuote = new Decimal(cheapest?.quote || 0);
              const delta = cheapest ? q.minus(cheapestQuote) : new Decimal(0);
              const pct = cheapest && cheapestQuote.gt(0) ? delta.div(cheapestQuote).times(100) : new Decimal(0);
              const isCheapest = cheapest && cheapest.id === b.id;
              
              return (
                <tr key={b.id} style={{ backgroundColor: isCheapest ? "#ecfeff" : undefined }}>
                  <td>
                    <input
                      placeholder="Contractor name"
                      value={b.contractor}
                      onChange={e => setBids(prev => prev.map(x => x.id === b.id ? { ...x, contractor: e.target.value } : x))}
                    />
                  </td>
                  <td>
                    <input
                      type="number" step="0.01"
                      value={b.quote}
                      onChange={e => setBids(prev => prev.map(x => x.id === b.id ? { ...x, quote: e.target.value } : x))}
                    />
                  </td>
                  <td>{cheapest ? (delta.greaterThan(0) ? `+${delta.toFixed(2)}` : delta.toFixed(2)) : "-"}</td>
                  <td>{cheapest ? `${pct.toFixed(2)}%` : "-"}</td>
                  <td className="text-center">
                    <input
                      type="radio"
                      name="recommended"
                      checked={recommendedId === b.id}
                      onChange={() => setRecommendedId(b.id)}
                    />
                  </td>
                  <td>
                    {idx > 0 && (
                      <button onClick={() => removeBid(b.id)}>Remove</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div>
        <label>Comments (why recommended)</label>
        <textarea rows={4} value={comments} onChange={e => setComments(e.target.value)} />
      </div>

      <div className="flex gap-3 items-center">
        <button onClick={submit} disabled={saving}>Submit</button>
        {message && <span className="badge">{message}</span>}
      </div>
    </div>
  );
}