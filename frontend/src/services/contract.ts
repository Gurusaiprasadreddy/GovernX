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

// ─── Sample / Demo Data ───────────────────────────────────────────────────────

export const INITIAL_SAMPLE_PROPOSALS: Proposal[] = [
  {
    id: 0,
    target: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    data: "0x7b8849b2000000000000000000000000000000000000000000000000000000000000002a",
    yesCount: 10,
    noCount: 1,
    executed: true,
  },
  {
    id: 1,
    target: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    data: "0x608060405234801561001057600080fd5b50604051610120380380610120833981016040",
    yesCount: 8,
    noCount: 2,
    executed: false,
  },
  {
    id: 2,
    target: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    data: "0xa9059cbb00000000000000000000000090f79bf6eb2c4f870365e785982e1f101e93b9060000000000000000000000000000000000000000000000000de0b6b3a7640000",
    yesCount: 4,
    noCount: 5,
    executed: false,
  },
  {
    id: 3,
    target: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    data: "0x2e1a7d4d000000000000000000000000000000000000000000000000000000000000000a",
    yesCount: 9,
    noCount: 0,
    executed: false,
  },
];

function getSampleProposals(): Proposal[] {
  try {
    const raw = localStorage.getItem("governx_sample_proposals");
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_SAMPLE_PROPOSALS;
}

function saveSampleProposals(props: Proposal[]) {
  try {
    localStorage.setItem("governx_sample_proposals", JSON.stringify(props));
  } catch {}
}

function getMockVotes(): Record<string, { voted: boolean; support: boolean }> {
  try {
    const raw = localStorage.getItem("governx_mock_votes");
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveMockVote(proposalId: number, voter: string, support: boolean) {
  try {
    const votes = getMockVotes();
    votes[`${proposalId}_${voter.toLowerCase()}`] = { voted: true, support };
    localStorage.setItem("governx_mock_votes", JSON.stringify(votes));
  } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function contractAddress(): Address {
  return CONTRACT_ADDRESS as Address;
}

// ─── Read Operations ──────────────────────────────────────────────────────────

export async function getProposalCount(): Promise<number> {
  if (!CONTRACT_ADDRESS) return getSampleProposals().length;
  const client = getPublicClient();
  const count = await client.readContract({
    address: contractAddress(),
    abi: VOTING_ABI,
    functionName: "getProposalCount",
  });
  return Number(count);
}

export async function getProposal(id: number): Promise<Proposal> {
  if (!CONTRACT_ADDRESS) {
    const found = getSampleProposals().find((p) => p.id === id);
    if (!found) throw new Error(`Proposal #${id} not found.`);
    return found;
  }
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
  if (!CONTRACT_ADDRESS) return getSampleProposals();
  const count = await getProposalCount();
  if (count === 0) return [];
  const ids = Array.from({ length: count }, (_, i) => i);
  const proposals = await Promise.all(ids.map((id) => getProposal(id)));
  return proposals;
}

export async function isMember(address: Address): Promise<boolean> {
  if (!CONTRACT_ADDRESS) return true;
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
  if (!CONTRACT_ADDRESS) {
    const votes = getMockVotes();
    return votes[`${proposalId}_${voter.toLowerCase()}`] ?? { voted: false, support: false };
  }
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
  if (!CONTRACT_ADDRESS) {
    const current = getSampleProposals();
    const newProp: Proposal = {
      id: current.length,
      target,
      data,
      yesCount: 1,
      noCount: 0,
      executed: false,
    };
    saveSampleProposals([...current, newProp]);
    saveMockVote(newProp.id, from, true);
    return ("0xmock_create_" + Date.now().toString(16).padEnd(50, "0")) as Hash;
  }

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
  if (!CONTRACT_ADDRESS) {
    const current = getSampleProposals();
    const idx = current.findIndex((p) => p.id === proposalId);
    if (idx !== -1) {
      const p = current[idx];
      const votes = getMockVotes();
      const prev = votes[`${proposalId}_${from.toLowerCase()}`];

      let yes = p.yesCount;
      let no = p.noCount;
      if (prev?.voted) {
        if (prev.support && !support) {
          yes = Math.max(0, yes - 1);
          no += 1;
        } else if (!prev.support && support) {
          no = Math.max(0, no - 1);
          yes += 1;
        }
      } else {
        if (support) yes += 1;
        else no += 1;
      }

      const executed = yes >= 10 ? true : p.executed;
      current[idx] = { ...p, yesCount: yes, noCount: no, executed };
      saveSampleProposals(current);
      saveMockVote(proposalId, from, support);
    }
    return ("0xmock_vote_" + Date.now().toString(16).padEnd(52, "0")) as Hash;
  }

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
  if (hash.startsWith("0xmock")) {
    await new Promise((r) => setTimeout(r, 600));
    return { success: true };
  }
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
      storedValue: 42n,
      message: "Governance Auto-Execution Verified",
      lastCaller: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      updateCount: 1n,
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
