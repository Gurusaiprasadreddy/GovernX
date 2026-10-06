// Shared TypeScript types for the GovernX frontend

export interface Proposal {
  id: number;
  target: string;
  data: string;
  yesCount: number;
  noCount: number;
  executed: boolean;
}

export interface UserVote {
  voted: boolean;
  support: boolean;
}

export type TxStatus =
  | "idle"
  | "confirm"   // waiting for wallet confirmation
  | "pending"   // submitted, waiting for receipt
  | "confirmed"
  | "failed";

export interface TxState {
  status: TxStatus;
  hash?: string;
  error?: string;
}

export interface WalletState {
  address: string | null;
  chainId: number | null;
  connected: boolean;
  isMember: boolean | null;
}

export interface DashboardStats {
  totalProposals: number;
  activeProposals: number;
  executedProposals: number;
  totalVotes: number;
}

export interface DemoTargetState {
  storedValue: bigint;
  message: string;
  lastCaller: string;
  updateCount: bigint;
}
