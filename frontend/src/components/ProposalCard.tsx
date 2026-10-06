import { Link } from "react-router-dom";
import { clsx } from "clsx";
import { VotingProgress } from "./VotingProgress";
import { EXPLORER_URL } from "@/config/chain";
import { shortenAddress } from "@/services/wallet";
import type { Proposal } from "@/types";

interface ProposalCardProps {
  proposal: Proposal;
  className?: string;
}

export function ProposalCard({ proposal, className }: ProposalCardProps) {
  const { id, target, yesCount, noCount, executed } = proposal;

  return (
    <Link to={`/proposals/${id}`} className="block group">
      <div
        className={clsx(
          "glass-card-hover p-5 space-y-4 animate-slide-up",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="section-label">Proposal</span>
              <span className="font-mono text-xs text-slate-500">#{id}</span>
            </div>
            <p className="mt-1 text-sm text-slate-400 font-mono truncate max-w-[200px]">
              {shortenAddress(target)}
            </p>
          </div>
          <span className={clsx(executed ? "badge-executed" : "badge-active")}>
            {executed ? (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Executed
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                Active
              </>
            )}
          </span>
        </div>

        {/* Votes summary */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">{yesCount}</span>
            <span className="text-xs text-slate-500">YES</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-sm font-semibold text-red-400">{noCount}</span>
            <span className="text-xs text-slate-500">NO</span>
          </div>
        </div>

        {/* Progress */}
        <VotingProgress
          yesCount={yesCount}
          noCount={noCount}
          executed={executed}
          size="sm"
        />

        {/* Explorer link */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <a
            href={`${EXPLORER_URL}/address/${target}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-slate-500 hover:text-brand-400 transition-colors inline-flex items-center gap-1"
          >
            View target ↗
          </a>
          <span className="text-xs text-brand-400 group-hover:translate-x-1 transition-transform">
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}
