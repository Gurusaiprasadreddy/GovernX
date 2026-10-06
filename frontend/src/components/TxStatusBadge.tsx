import { clsx } from "clsx";
import { EXPLORER_URL } from "@/config/chain";
import type { TxState } from "@/types";

interface TxStatusBadgeProps {
  tx: TxState;
  className?: string;
}

const dots = <span className="flex gap-0.5">
  {[0, 1, 2].map((i) => (
    <span
      key={i}
      className="w-1 h-1 bg-current rounded-full animate-pulse"
      style={{ animationDelay: `${i * 0.2}s` }}
    />
  ))}
</span>;

export function TxStatusBadge({ tx, className }: TxStatusBadgeProps) {
  if (tx.status === "idle") return null;

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {tx.status === "confirm" && (
        <div className="tx-confirm">
          <span className="spinner" />
          Waiting for wallet confirmation...
        </div>
      )}
      {tx.status === "pending" && (
        <div className="tx-pending">
          <span className="spinner" />
          Transaction pending... {dots}
        </div>
      )}
      {tx.status === "confirmed" && (
        <div className="tx-confirmed">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Transaction confirmed
        </div>
      )}
      {tx.status === "failed" && (
        <div className="tx-failed">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          {tx.error ?? "Transaction failed"}
        </div>
      )}

      {tx.hash && (
        <a
          href={`${EXPLORER_URL}/tx/${tx.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)} ↗
        </a>
      )}
    </div>
  );
}
