import { ProposalCard } from "@/components/ProposalCard";
import { useProposals } from "@/hooks/useProposals";
import { Link } from "react-router-dom";
import { clsx } from "clsx";
import { useState } from "react";

type Filter = "all" | "active" | "executed";

export function ProposalsPage() {
  const { proposals, loading, error, refresh } = useProposals();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = proposals.filter((p) => {
    if (filter === "active") return !p.executed;
    if (filter === "executed") return p.executed;
    return true;
  });

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${proposals.length})` },
    { key: "active", label: `Active (${proposals.filter((p) => !p.executed).length})` },
    { key: "executed", label: `Executed (${proposals.filter((p) => p.executed).length})` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Proposals</h1>
          <p className="text-slate-500 mt-1">All governance proposals on-chain</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refresh} disabled={loading} className="btn-ghost text-sm">
            {loading ? <span className="spinner" /> : "↻"} Refresh
          </button>
          <Link to="/create" className="btn-primary">+ New Proposal</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 p-1 bg-surface-900 rounded-xl w-fit mb-8">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === t.key
                ? "bg-brand-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card p-5 border border-red-500/20 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card p-5 h-52 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="glass-card p-16 text-center">
          <div className="text-5xl mb-4">{filter === "executed" ? "✅" : "📋"}</div>
          <p className="text-slate-400 font-medium mb-2">
            {filter === "all"
              ? "No proposals yet"
              : filter === "active"
              ? "No active proposals"
              : "No executed proposals"}
          </p>
          <p className="text-slate-600 text-sm mb-6">
            {filter === "all"
              ? "Create the first governance proposal."
              : "Change the filter to see other proposals."}
          </p>
          {filter === "all" && (
            <Link to="/create" className="btn-primary">
              Create Proposal
            </Link>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      )}
    </div>
  );
}
