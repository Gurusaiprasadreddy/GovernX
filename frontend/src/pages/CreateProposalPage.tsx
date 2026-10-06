import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { TxStatusBadge } from "@/components/TxStatusBadge";
import { useTx } from "@/hooks/useTx";
import { createProposal, encodeDemoUpdateValue } from "@/services/contract";
import { DEMO_TARGET_ADDRESS } from "@/config/chain";
import { isAddress } from "viem";
import type { WalletState } from "@/types";
import type { Address } from "viem";

interface CreateProposalPageProps {
  wallet: WalletState;
  isCorrectNetwork: boolean;
  onConnect: () => void;
}

export function CreateProposalPage({
  wallet,
  isCorrectNetwork,
  onConnect,
}: CreateProposalPageProps) {
  const navigate = useNavigate();
  const { tx, run, reset } = useTx();

  const [target, setTarget] = useState(DEMO_TARGET_ADDRESS ?? "");
  const [calldata, setCalldata] = useState("");
  const [errors, setErrors] = useState<{ target?: string; calldata?: string }>({});

  const [demoValue, setDemoValue] = useState("42");
  const [showCalldataHelper, setShowCalldataHelper] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!target) e.target = "Target address is required.";
    else if (!isAddress(target)) e.target = "Must be a valid Ethereum address.";
    if (!calldata) e.calldata = "Calldata is required.";
    else if (!calldata.startsWith("0x")) e.calldata = "Calldata must start with 0x.";
    else if (calldata.length < 10) e.calldata = "Calldata too short (need at least a 4-byte selector).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!wallet.address) return;

    const success = await run(() =>
      createProposal(
        wallet.address as Address,
        target as Address,
        calldata as `0x${string}`
      )
    );

    if (success) {
      toast.success("Proposal created successfully!");
      setTimeout(() => navigate("/proposals"), 1500);
    } else {
      toast.error("Failed to create proposal.");
    }
  };

  const applyDemoCalldata = () => {
    const val = parseInt(demoValue);
    if (isNaN(val) || val < 0) {
      toast.error("Enter a valid positive number.");
      return;
    }
    try {
      const encoded = encodeDemoUpdateValue(val);
      setCalldata(encoded);
      setTarget(DEMO_TARGET_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
      toast.success("Demo calldata applied!");
    } catch {
      toast.error("Failed to encode calldata.");
    }
  };

  const canCreate = wallet.connected && isCorrectNetwork && wallet.isMember === true;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Create Proposal</h1>
        <p className="text-slate-500 mt-1">
          Submit a governance proposal to be voted on by members.
        </p>
      </div>

      {/* Gating */}
      {!wallet.connected && (
        <div className="glass-card p-6 mb-6 border border-brand-500/20 text-center">
          <p className="text-slate-400 mb-4">Connect your wallet to create a proposal.</p>
          <button onClick={onConnect} className="btn-primary">
            Connect Wallet
          </button>
        </div>
      )}

      {wallet.connected && !isCorrectNetwork && (
        <div className="glass-card p-5 mb-6 border border-amber-500/20">
          <p className="text-amber-400 text-sm">⚠ Switch to Sepolia to create proposals.</p>
        </div>
      )}

      {wallet.connected && isCorrectNetwork && wallet.isMember === false && (
        <div className="glass-card p-5 mb-6 border border-red-500/20">
          <p className="text-red-400 text-sm font-medium mb-1">Not a Governance Member</p>
          <p className="text-slate-500 text-xs">
            Only members can create proposals. Your wallet address is not a member of this
            governance contract.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target */}
        <div>
          <label className="block section-label mb-2" htmlFor="target-address">
            Target Contract Address
          </label>
          <input
            id="target-address"
            type="text"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setErrors((prev) => ({ ...prev, target: undefined }));
            }}
            placeholder="0x..."
            className={clsx("input font-mono", errors.target && "input-error")}
            disabled={!canCreate || tx.status !== "idle"}
          />
          {errors.target && (
            <p className="text-xs text-red-400 mt-1.5">{errors.target}</p>
          )}
          <p className="text-xs text-slate-600 mt-1.5">
            The contract address that will be called when the proposal is executed.
          </p>
        </div>

        {/* Calldata */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="section-label" htmlFor="calldata">
              Calldata (hex)
            </label>
            <button
              type="button"
              onClick={() => setShowCalldataHelper((v) => !v)}
              className="text-xs text-brand-400 hover:text-brand-300"
            >
              {showCalldataHelper ? "Hide" : "What is calldata?"} ↗
            </button>
          </div>

          {showCalldataHelper && (
            <div className="glass-card p-4 mb-3 text-xs text-slate-400 leading-relaxed border border-brand-500/10">
              <p className="font-semibold text-slate-300 mb-1">What is calldata?</p>
              <p>
                Calldata is the ABI-encoded function call that the governance contract will
                execute on the target. It starts with a <span className="font-mono text-brand-400">4-byte function selector</span> (the
                first 4 bytes of the keccak256 hash of the function signature), followed by
                ABI-encoded arguments.
              </p>
              <p className="mt-2">
                Example: <span className="font-mono text-brand-400">updateValue(uint256)</span> with argument{" "}
                <span className="font-mono">42</span> encodes to{" "}
                <span className="font-mono text-emerald-400">0x8c9af...(32 byte uint)...</span>
              </p>
              <p className="mt-2 text-slate-500">
                Use the demo helper below to auto-generate valid calldata.
              </p>
            </div>
          )}

          <textarea
            id="calldata"
            value={calldata}
            onChange={(e) => {
              setCalldata(e.target.value);
              setErrors((prev) => ({ ...prev, calldata: undefined }));
            }}
            placeholder="0x..."
            rows={3}
            className={clsx("input font-mono resize-none", errors.calldata && "input-error")}
            disabled={!canCreate || tx.status !== "idle"}
          />
          {errors.calldata && (
            <p className="text-xs text-red-400 mt-1.5">{errors.calldata}</p>
          )}
        </div>

        {/* Demo helper */}
        {DEMO_TARGET_ADDRESS && (
          <div className="glass-card p-5 border border-brand-500/10">
            <p className="section-label mb-3">🔧 Demo Helper — updateValue(uint256)</p>
            <p className="text-xs text-slate-500 mb-4">
              Generate calldata to call{" "}
              <span className="font-mono text-brand-400">updateValue(uint256)</span> on the
              DemoTarget contract with a specific value.
            </p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1.5">New Value</label>
                <input
                  type="number"
                  value={demoValue}
                  onChange={(e) => setDemoValue(e.target.value)}
                  min="0"
                  className="input text-sm"
                  disabled={!canCreate}
                />
              </div>
              <button
                type="button"
                onClick={applyDemoCalldata}
                disabled={!canCreate}
                className="btn-secondary text-sm"
              >
                Apply
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2 font-mono">
              Target: {DEMO_TARGET_ADDRESS}
            </p>
          </div>
        )}

        {/* Tx status */}
        {tx.status !== "idle" && (
          <TxStatusBadge tx={tx} />
        )}

        {/* Submit */}
        <button
          type="submit"
          id="submit-proposal"
          disabled={!canCreate || tx.status === "confirm" || tx.status === "pending"}
          className="btn-primary w-full py-3 text-base"
        >
          {tx.status === "confirm" && (
            <><span className="spinner" /> Waiting for wallet...</>
          )}
          {tx.status === "pending" && (
            <><span className="spinner" /> Submitting proposal...</>
          )}
          {(tx.status === "idle" || tx.status === "failed") && (
            <>Submit Proposal</>
          )}
          {tx.status === "confirmed" && (
            <>✓ Proposal Created! Redirecting...</>
          )}
        </button>

        {tx.status === "failed" && (
          <button
            type="button"
            onClick={reset}
            className="btn-ghost w-full text-sm"
          >
            Try Again
          </button>
        )}
      </form>
    </div>
  );
}
