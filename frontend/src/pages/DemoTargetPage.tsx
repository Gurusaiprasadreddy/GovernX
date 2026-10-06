import { useState, useEffect, useCallback } from "react";
import { getDemoTargetState, encodeDemoUpdateValue } from "@/services/contract";
import { DEMO_TARGET_ADDRESS, EXPLORER_URL } from "@/config/chain";
import { shortenAddress } from "@/services/wallet";
import { Link } from "react-router-dom";
import type { DemoTargetState } from "@/types";

export function DemoTargetPage() {
  const [state, setState] = useState<DemoTargetState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState("42");
  const [encodedCalldata, setEncodedCalldata] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getDemoTargetState();
      setState(s);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Failed to load DemoTarget state");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleEncodeCalldata = () => {
    const val = parseInt(inputValue);
    if (isNaN(val) || val < 0) return;
    try {
      const encoded = encodeDemoUpdateValue(val);
      setEncodedCalldata(encoded);
    } catch {
      setEncodedCalldata("Error encoding calldata");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <p className="section-label mb-1">Certification Demo</p>
        <h1 className="text-3xl font-bold text-white">DemoTarget Contract</h1>
        <p className="text-slate-500 mt-1">
          This contract is used to demonstrate the 10-vote execution flow.
        </p>
      </div>

      {/* What is this */}
      <div className="glass-card p-6 mb-6 border border-brand-500/10">
        <h2 className="font-semibold text-slate-200 mb-3">How to use for your certification demo</h2>
        <ol className="space-y-2 text-sm text-slate-400">
          <li className="flex gap-3">
            <span className="font-mono text-brand-400 flex-shrink-0">01.</span>
            Generate calldata below by entering a new value.
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-brand-400 flex-shrink-0">02.</span>
            Go to{" "}
            <Link to="/create" className="text-brand-400 hover:underline">
              Create Proposal
            </Link>{" "}
            and paste the calldata (or use the Demo Helper).
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-brand-400 flex-shrink-0">03.</span>
            Gather 10 YES votes from different member accounts.
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-brand-400 flex-shrink-0">04.</span>
            Watch the <strong className="text-slate-300">storedValue</strong> here change after execution.
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-brand-400 flex-shrink-0">05.</span>
            Show the blockchain transaction hash as proof of execution.
          </li>
        </ol>
      </div>

      {/* Contract state */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-200">Current On-Chain State</h2>
          <button
            onClick={load}
            disabled={loading}
            className="btn-ghost text-xs"
          >
            {loading ? <span className="spinner" /> : "↻"} Refresh
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        {!DEMO_TARGET_ADDRESS && (
          <p className="text-slate-500 text-sm italic">
            DemoTarget not deployed yet. Set VITE_DEMO_TARGET_ADDRESS in your .env file.
          </p>
        )}

        {DEMO_TARGET_ADDRESS && (
          <div className="space-y-4">
            {/* Contract address */}
            <div>
              <p className="section-label mb-1">Contract Address</p>
              <a
                href={`${EXPLORER_URL}/address/${DEMO_TARGET_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-brand-400 hover:text-brand-300"
              >
                {DEMO_TARGET_ADDRESS} ↗
              </a>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-surface-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : state && (
              <div className="grid grid-cols-2 gap-4">
                <div className="stat-card">
                  <p className="section-label">storedValue</p>
                  <p className="text-3xl font-bold text-brand-400 mt-1">
                    {state.storedValue.toString()}
                  </p>
                </div>
                <div className="stat-card">
                  <p className="section-label">updateCount</p>
                  <p className="text-3xl font-bold text-purple-400 mt-1">
                    {state.updateCount.toString()}
                  </p>
                </div>
                <div className="stat-card col-span-2">
                  <p className="section-label">lastCaller (GovernX contract)</p>
                  <p className="font-mono text-xs text-slate-400 mt-1 break-all">
                    {state.lastCaller === "0x0000000000000000000000000000000000000000"
                      ? "—"
                      : state.lastCaller}
                  </p>
                </div>
                {state.message && (
                  <div className="stat-card col-span-2">
                    <p className="section-label">message</p>
                    <p className="text-sm text-slate-300 mt-1">{state.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calldata generator */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-slate-200 mb-4">Calldata Generator</h2>
        <p className="text-xs text-slate-500 mb-4">
          Generate ABI-encoded calldata for{" "}
          <span className="font-mono text-brand-400">updateValue(uint256)</span>.
        </p>
        <div className="flex gap-3 items-end mb-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1.5">New value (uint256)</label>
            <input
              type="number"
              min="0"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="input text-sm"
            />
          </div>
          <button
            onClick={handleEncodeCalldata}
            className="btn-primary text-sm"
          >
            Generate
          </button>
        </div>

        {encodedCalldata && (
          <div>
            <p className="section-label mb-1.5">Encoded Calldata</p>
            <div className="flex items-start gap-2">
              <pre className="flex-1 text-xs font-mono text-emerald-400 bg-surface-900 rounded-xl p-3 border border-white/5 overflow-x-auto whitespace-pre-wrap break-all">
                {encodedCalldata}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(encodedCalldata);
                }}
                className="btn-secondary text-xs flex-shrink-0 py-2"
                title="Copy to clipboard"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Function selector:{" "}
              <span className="font-mono text-slate-400">{encodedCalldata.slice(0, 10)}</span>
              {" · "}
              Paste this calldata into the Create Proposal form.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
