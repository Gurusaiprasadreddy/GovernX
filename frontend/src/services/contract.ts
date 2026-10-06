/**
 * Contract service — all reads/writes to the GovernX Voting contract.
 */

import {
  type Address,
  type Hash,
  encodeFunctionData,
} from "viem";
import { sepolia } from "viem/chains";
import { getPublicClient, getWalletClient } from "./wallet";
import { VOTING_ABI, DEMO_TARGET_ABI } from "@/abi/contracts";
import { CONTRACT_ADDRESS, DEMO_TARGET_ADDRESS } from "@/config/chain";
import type { Proposal, DemoTargetState } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function contractAddress(): Address {
  return CONTRACT_ADDRESS as Address;
}

// ─── Read Operations ──────────────────────────────────────────────────────────

export async function getProposalCount(): Promise<number> {
  const client = getPublicClient();
  const count = await client.readContract({
    address: contractAddress(),
    abi: VOTING_ABI,
    functionName: "getProposalCount",
  });
  return Number(count);
}

export async function getProposal(id: number): Promise<Proposal> {
  const client = getPublicClient();
  const [target, data, yesCount, noCount, executed] = await client.readContract({
    address: contractAddress(),
    abi: VOTING_ABI,
    functionName: "getProposal",
    args: [BigInt(id)],
  });
  return {
    id,
    target: target as string,
    data: data as string,
    yesCount: Number(yesCount),
    noCount: Number(noCount),
    executed: executed as boolean,
  };
}

export async function getAllProposals(): Promise<Proposal[]> {
  const count = await getProposalCount();
  if (count === 0) return [];
  const ids = Array.from({ length: count }, (_, i) => i);
  const proposals = await Promise.all(ids.map((id) => getProposal(id)));
  return proposals;
}

export async function isMember(address: Address): Promise<boolean> {
  const client = getPublicClient();
  return client.readContract({
    address: contractAddress(),
    abi: VOTING_ABI,
    functionName: "members",
    args: [address],
  });
}

export async function getUserVote(
  proposalId: number,
  voter: Address
): Promise<{ voted: boolean; support: boolean }> {
  const client = getPublicClient();
  const [voted, support] = await client.readContract({
    address: contractAddress(),
    abi: VOTING_ABI,
    functionName: "getUserVote",
    args: [BigInt(proposalId), voter],
  });
  return { voted: voted as boolean, support: support as boolean };
}

// ─── Write Operations ─────────────────────────────────────────────────────────

export async function createProposal(
  from: Address,
  target: Address,
  data: `0x${string}`
): Promise<Hash> {
  const walletClient = getWalletClient();
  if (!walletClient) throw new Error("Wallet not connected");

  return walletClient.writeContract({
    account: from,
    address: contractAddress(),
    abi: VOTING_ABI,
    functionName: "newProposal",
    args: [target, data],
    chain: sepolia,
  });
}

export async function castVote(
  from: Address,
  proposalId: number,
  support: boolean
): Promise<Hash> {
  const walletClient = getWalletClient();
  if (!walletClient) throw new Error("Wallet not connected");

  return walletClient.writeContract({
    account: from,
    address: contractAddress(),
    abi: VOTING_ABI,
    functionName: "castVote",
    args: [BigInt(proposalId), support],
    chain: sepolia,
  });
}

export async function waitForTx(hash: Hash): Promise<{ success: boolean }> {
  const client = getPublicClient();
  const receipt = await client.waitForTransactionReceipt({ hash });
  return { success: receipt.status === "success" };
}

// ─── Calldata helpers ─────────────────────────────────────────────────────────

/**
 * Encode a call to DemoTarget.updateValue(uint256).
 * Returns the calldata hex string ready to paste into the Create Proposal form.
 */
export function encodeDemoUpdateValue(value: number): `0x${string}` {
  return encodeFunctionData({
    abi: DEMO_TARGET_ABI,
    functionName: "updateValue",
    args: [BigInt(value)],
  });
}

/**
 * Encode arbitrary calldata from a function signature + args.
 * For the certification demo, use encodeDemoUpdateValue instead.
 */
export function encodeCalldata(
  _signature: string,
  _argsRaw: string
): `0x${string}` {
  throw new Error(
    "Use the helper buttons below to generate valid calldata, or paste raw hex calldata."
  );
}

// ─── DemoTarget reads ─────────────────────────────────────────────────────────

export async function getDemoTargetState(): Promise<DemoTargetState> {
  if (!DEMO_TARGET_ADDRESS) {
    return {
      storedValue: 0n,
      message: "",
      lastCaller: "0x0000000000000000000000000000000000000000",
      updateCount: 0n,
    };
  }
  const client = getPublicClient();
  const [value, msg_, caller, count] = await client.readContract({
    address: DEMO_TARGET_ADDRESS as Address,
    abi: DEMO_TARGET_ABI,
    functionName: "getState",
  });
  return {
    storedValue: value as bigint,
    message: msg_ as string,
    lastCaller: caller as string,
    updateCount: count as bigint,
  };
}

// ─── Error parsing ────────────────────────────────────────────────────────────

export function parseContractError(err: unknown): string {
  if (!err) return "Unknown error";
  const e = err as { shortMessage?: string; message?: string; code?: number };

  if (e.code === 4001 || e.message?.includes("User rejected"))
    return "Transaction rejected by user.";
  if (e.shortMessage) return e.shortMessage;
  if (e.message) {
    // Strip viem internal stack noise
    const cleaned = e.message.split("\n")[0];
    if (cleaned.includes("GovernX:")) return cleaned.split("GovernX:")[1].trim();
    return cleaned;
  }
  return "An unexpected error occurred.";
}
