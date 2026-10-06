import { clsx } from "clsx";
import { EXECUTION_THRESHOLD } from "@/config/chain";

interface VotingProgressProps {
  yesCount: number;
  noCount: number;
  executed: boolean;
  size?: "sm" | "md" | "lg";
}

export function VotingProgress({
  yesCount,
  noCount,
  executed,
  size = "md",
}: VotingProgressProps) {
  const total = yesCount + noCount;
  const yesPct = total === 0 ? 0 : Math.round((yesCount / total) * 100);
  const threshold = EXECUTION_THRESHOLD;
  const thresholdPct = Math.min((yesCount / threshold) * 100, 100);

  const isThresholdReached = yesCount >= threshold;

  return (
    <div className={clsx("space-y-3", size === "lg" && "space-y-4")}>
      {/* Threshold progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">
            YES progress toward execution
          </span>
          <span
            className={clsx(
              "font-semibold font-mono",
              isThresholdReached ? "text-emerald-400" : "text-slate-300"
            )}
          >
            {yesCount} / {threshold}
          </span>
        </div>
        <div className="progress-bar">
          <div
            className={clsx(
              "progress-fill",
              isThresholdReached && "progress-fill-success"
            )}
            style={{ width: `${thresholdPct}%` }}
          />
        </div>
        {isThresholdReached && !executed && (
          <p className="text-xs text-amber-400 flex items-center gap-1 animate-pulse">
            <span>⚡</span> Threshold reached — executing...
          </p>
        )}
        {executed && (
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <span>✓</span> Proposal executed on-chain
          </p>
        )}
      </div>

      {/* Yes/No breakdown */}
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Vote breakdown ({total} total)</span>
            <span>{yesPct}% YES</span>
          </div>
          <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
            <div
              className="bg-emerald-500 rounded-l-full transition-all duration-700"
              style={{ width: `${yesPct}%` }}
            />
            <div
              className="bg-red-500 rounded-r-full transition-all duration-700 flex-1"
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-400">YES {yesCount}</span>
            <span className="text-red-400">NO {noCount}</span>
          </div>
        </div>
      )}

      {total === 0 && (
        <p className="text-xs text-slate-500 italic">No votes cast yet.</p>
      )}
    </div>
  );
}
