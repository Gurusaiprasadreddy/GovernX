import { Link } from "react-router-dom";
import { clsx } from "clsx";
import { ProposalCard } from "@/components/ProposalCard";
import { useProposals } from "@/hooks/useProposals";
import { CONTRACT_ADDRESS, DEMO_TARGET_ADDRESS, EXPLORER_URL, CHAIN_NAME, SEPOLIA_CHAIN_ID } from "@/config/chain";
import { shortenAddress } from "@/services/wallet";
import type { WalletState } from "@/types";

interface DashboardPageProps {
  wallet: WalletState;
  isCorrectNetwork: boolean;
  onConnect: () => void;
  onSwitchNetwork: () => void;
}

export function DashboardPage({
  wallet,
  isCorrectNetwork,
  onConnect,
  onSwitchNetwork,
}: DashboardPageProps) {
  const { proposals, loading, error, refresh } = useProposals();

  const executed = proposals.filter((p) => p.executed).length;
  const active = proposals.filter((p) => !p.executed).length;
  const totalVotes = proposals.reduce((acc, p) => acc + p.yesCount + p.noCount, 0);

  const stats = [
    { label: "Total Proposals", value: proposals.length, accent: "text-brand-400" },
    { label: "Active", value: active, accent: "text-blue-400" },
    { label: "Executed", value: executed, accent: "text-emerald-400" },
    { label: "Total Votes", value: totalVotes, accent: "text-purple-400" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of governance activity</p>
        </div>
        <Link to="/create" className="btn-primary self-start sm:self-auto">
          + New Proposal
        </Link>
      </div>

      {/* Network / wallet banners */}
      {!wallet.connected && (
        <div className="glass-card p-5 flex items-center gap-4 mb-8 border-brand-500/20">
          <div className="w-10 h-10 rounded-full bg-brand-500/15 flex items-center justify-center text-brand-400 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-200">Wallet not connected</p>
            <p className="text-xs text-slate-500">Connect MetaMask to create proposals and vote.</p>
          </div>
          <button onClick={onConnect} className="btn-primary text-sm flex-shrink-0">
            Connect
          </button>
        </div>
      )}

      {wallet.connected && !isCorrectNetwork && (
        <div className="glass-card p-5 flex items-center gap-4 mb-8 border-amber-500/20">
          <span className="text-amber-400 text-xl flex-shrink-0">⚠</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-300">Wrong network</p>
            <p className="text-xs text-slate-500">Switch to {CHAIN_NAME} to interact with the contract.</p>
          </div>
          <button onClick={onSwitchNetwork} className="btn text-sm flex-shrink-0 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30">
            Switch Network
          </button>
        </div>
      )}

      {/* Wallet / member status */}
      {wallet.connected && (
        <div className="glass-card p-5 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="section-label mb-1">Connected Wallet</p>
              <p className="font-mono text-sm text-slate-300">
                {shortenAddress(wallet.address!)}
              </p>
            </div>
            <div>
              <p className="section-label mb-1">Network</p>
              <p className="text-sm text-slate-300 flex items-center gap-1.5">
                <span className={clsx("w-1.5 h-1.5 rounded-full", isCorrectNetwork ? "bg-emerald-400" : "bg-amber-400")} />
                {isCorrectNetwork ? CHAIN_NAME : `Chain ${wallet.chainId}`}
              </p>
            </div>
            <div>
              <p className="section-label mb-1">Membership</p>
              {wallet.isMember === null ? (
                <p className="text-xs text-slate-500">—</p>
              ) : (
                <span className={clsx("badge", wallet.isMember ? "badge-member" : "badge-non-member")}>
                  {wallet.isMember ? "✓ Member" : "✗ Not a Member"}
                </span>
              )}
            </div>
            <div>
              <p className="section-label mb-1">Chain ID</p>
              <p className="font-mono text-sm text-slate-500">{SEPOLIA_CHAIN_ID}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <p className="section-label">{s.label}</p>
            <p className={clsx("text-3xl font-bold mt-1", s.accent)}>
              {loading ? (
                <span className="inline-block w-8 h-7 bg-surface-800 rounded animate-pulse" />
              ) : (
                s.value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Blockchain info */}
      <div className="glass-card p-5 mb-10">
        <p className="section-label mb-4">Blockchain Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Governance Contract</p>
            {CONTRACT_ADDRESS ? (
              <a
                href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                {shortenAddress(CONTRACT_ADDRESS)} ↗
              </a>
            ) : (
              <p className="font-mono text-xs text-brand-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                0x5FbD...0aa3 (Sample)
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">DemoTarget Contract</p>
            {DEMO_TARGET_ADDRESS ? (
              <a
                href={`${EXPLORER_URL}/address/${DEMO_TARGET_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                {shortenAddress(DEMO_TARGET_ADDRESS)} ↗
              </a>
            ) : (
              <p className="font-mono text-xs text-brand-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                0xe7f1...0512 (Sample)
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Explorer</p>
            <a
              href={EXPLORER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-400 hover:text-brand-300"
            >
              Sepolia Etherscan ↗
            </a>
          </div>
        </div>
      </div>

      {/* Proposals */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Proposals</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              disabled={loading}
              className="btn-ghost text-xs"
            >
              {loading ? <span className="spinner" /> : "↻"} Refresh
            </button>
            <Link to="/proposals" className="text-sm text-brand-400 hover:text-brand-300">
              View all →
            </Link>
          </div>
        </div>

        {error && (
          <div className="glass-card p-5 border border-red-500/20 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-5 h-48 animate-pulse bg-surface-900/40" />
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-slate-400 font-medium mb-1">No proposals yet</p>
            <p className="text-slate-600 text-sm mb-6">
              Be the first to create a governance proposal.
            </p>
            <Link to="/create" className="btn-primary">
              Create Proposal
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {proposals.slice(0, 6).map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
