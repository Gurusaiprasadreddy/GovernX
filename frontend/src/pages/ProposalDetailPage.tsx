import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { VotingProgress } from "@/components/VotingProgress";
import { TxStatusBadge } from "@/components/TxStatusBadge";
import { useTx } from "@/hooks/useTx";
import {
  getProposal,
  getUserVote,
  castVote,
} from "@/services/contract";
import { shortenAddress } from "@/services/wallet";
import { EXPLORER_URL, EXECUTION_THRESHOLD } from "@/config/chain";
import type { Proposal, UserVote, WalletState } from "@/types";
import type { Address } from "viem";

interface ProposalDetailPageProps {
  wallet: WalletState;
  isCorrectNetwork: boolean;
}

export function ProposalDetailPage({ wallet, isCorrectNetwork }: ProposalDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const proposalId = Number(id);

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [userVote, setUserVote] = useState<UserVote | null>(null);
  const [loadingProposal, setLoadingProposal] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { tx, run, reset } = useTx();

  const load = useCallback(async () => {
    setLoadingProposal(true);
    setError(null);
    try {
      const p = await getProposal(proposalId);
      setProposal(p);

      if (wallet.address) {
        const vote = await getUserVote(proposalId, wallet.address as Address);
        setUserVote(vote);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Failed to load proposal");
    } finally {
      setLoadingProposal(false);
    }
  }, [proposalId, wallet.address]);

  useEffect(() => {
    load();
  }, [load]);

  const handleVote = async (support: boolean) => {
    if (!wallet.address) return;

    const success = await run(() =>
      castVote(wallet.address as Address, proposalId, support)
    );

    if (success) {
      toast.success(`Vote ${support ? "YES" : "NO"} submitted!`);
      await load();
    } else {
      toast.error("Vote failed. See details below.");
    }
  };

  if (loadingProposal) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
        <div className="glass-card p-8 space-y-6 animate-pulse">
          <div className="h-6 bg-surface-800 rounded w-32" />
          <div className="h-10 bg-surface-800 rounded w-64" />
          <div className="h-4 bg-surface-800 rounded w-full" />
          <div className="h-4 bg-surface-800 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="glass-card p-8 border border-red-500/20">
          <p className="text-red-400 mb-4">{error}</p>
          <Link to="/proposals" className="btn-secondary text-sm">
            ← Back to Proposals
          </Link>
        </div>
      </div>
    );
  }

  if (!proposal) return null;

  const canVote =
    wallet.connected &&
    isCorrectNetwork &&
    wallet.isMember === true &&
    !proposal.executed;

  const hasThreshold = proposal.yesCount >= EXECUTION_THRESHOLD;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Back */}
      <Link
        to="/proposals"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 mb-8 transition-colors"
      >
        ← Back to Proposals
      </Link>

      <div className="space-y-6">
        {/* Header card */}
        <div className="glass-card p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="section-label mb-1">Proposal #{proposalId}</p>
              <h1 className="text-2xl font-bold text-white">
                Governance Proposal
              </h1>
            </div>
            <span
              className={clsx(
                "badge mt-1",
                proposal.executed ? "badge-executed" : "badge-active"
              )}
            >
              {proposal.executed ? "✓ Executed" : "● Active"}
            </span>
          </div>

          {/* Execution status */}
          {hasThreshold && !proposal.executed && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
              <p className="text-amber-300 font-semibold text-sm">⚡ THRESHOLD REACHED</p>
              <p className="text-amber-400/70 text-xs mt-1">
                Executing proposal on-chain...
              </p>
            </div>
          )}
          {proposal.executed && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <p className="text-emerald-300 font-semibold text-sm">✅ PROPOSAL EXECUTED</p>
              <p className="text-emerald-400/70 text-xs mt-1">
                The target contract was called with the encoded calldata.
              </p>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="section-label mb-1.5">Target Contract</p>
              <a
                href={`${EXPLORER_URL}/address/${proposal.target}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-brand-400 hover:text-brand-300 break-all"
              >
                {proposal.target} ↗
              </a>
            </div>
            <div>
              <p className="section-label mb-1.5">Calldata</p>
              <p className="font-mono text-xs text-slate-500 break-all bg-surface-900 rounded-lg p-2 border border-white/5">
                {proposal.data.length > 66
                  ? proposal.data.slice(0, 66) + "..."
                  : proposal.data}
              </p>
            </div>
          </div>
        </div>

        {/* Voting card */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Voting</h2>

          <VotingProgress
            yesCount={proposal.yesCount}
            noCount={proposal.noCount}
            executed={proposal.executed}
            size="lg"
          />

          {/* Step indicators */}
          <div className="flex items-center gap-2 flex-wrap mt-5">
            {Array.from({ length: EXECUTION_THRESHOLD }, (_, i) => (
              <div
                key={i}
                className={clsx(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors",
                  i < proposal.yesCount
                    ? "bg-brand-500 text-white"
                    : "bg-surface-800 text-slate-600"
                )}
              >
                {i + 1}
              </div>
            ))}
            <span className="text-xs text-slate-500 ml-1">
              {EXECUTION_THRESHOLD} YES needed to execute
            </span>
          </div>
        </div>

        {/* Vote buttons */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Cast Your Vote</h2>

          {/* Current user vote */}
          {userVote?.voted && (
            <div className="mb-5 flex items-center gap-2 text-sm">
              <span className="text-slate-500">Your current vote:</span>
              <span
                className={clsx(
                  "badge",
                  userVote.support ? "badge-member" : "badge-non-member"
                )}
              >
                {userVote.support ? "✓ YES" : "✗ NO"}
              </span>
              {!proposal.executed && (
                <span className="text-xs text-slate-600">(you can change it)</span>
              )}
            </div>
          )}

          {/* Gating messages */}
          {!wallet.connected && (
            <p className="text-sm text-slate-500 italic mb-4">
              Connect your wallet to vote.
            </p>
          )}
          {wallet.connected && !isCorrectNetwork && (
            <p className="text-sm text-amber-400 italic mb-4">
              Switch to Sepolia to vote.
            </p>
          )}
          {wallet.connected && isCorrectNetwork && wallet.isMember === false && (
            <p className="text-sm text-red-400 italic mb-4">
              Only governance members can vote. Your address is not a member.
            </p>
          )}
          {proposal.executed && (
            <p className="text-sm text-slate-500 italic mb-4">
              This proposal has already been executed. Voting is closed.
            </p>
          )}

          {canVote && (
            <div className="flex gap-3">
              <button
                id="vote-yes"
                onClick={() => handleVote(true)}
                disabled={tx.status === "confirm" || tx.status === "pending"}
                className={clsx(
                  "btn-success flex-1",
                  userVote?.voted && userVote.support && "ring-2 ring-emerald-500"
                )}
              >
                {tx.status !== "idle" ? <span className="spinner" /> : "✓"} Vote YES
              </button>
              <button
                id="vote-no"
                onClick={() => handleVote(false)}
                disabled={tx.status === "confirm" || tx.status === "pending"}
                className={clsx(
                  "btn-danger flex-1",
                  userVote?.voted && !userVote.support && "ring-2 ring-red-500"
                )}
              >
                {tx.status !== "idle" ? <span className="spinner" /> : "✗"} Vote NO
              </button>
            </div>
          )}

          {/* Tx status */}
          {tx.status !== "idle" && (
            <div className="mt-4">
              <TxStatusBadge tx={tx} />
              {tx.status === "confirmed" && (
                <button onClick={() => { reset(); load(); }} className="btn-ghost text-xs mt-2">
                  Done
                </button>
              )}
            </div>
          )}
        </div>

        {/* Raw data */}
        <div className="glass-card p-6">
          <p className="section-label mb-3">Raw Calldata</p>
          <pre className="text-xs font-mono text-slate-500 bg-surface-900 rounded-xl p-4 border border-white/5 overflow-x-auto whitespace-pre-wrap break-all">
            {proposal.data}
          </pre>
          {proposal.data.length > 10 && (
            <p className="text-xs text-slate-600 mt-2">
              Function selector: <span className="text-slate-400 font-mono">{proposal.data.slice(0, 10)}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
