/**
 * Wallet service — MetaMask interaction via window.ethereum.
 * Uses viem's createWalletClient + createPublicClient internally.
 */

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type PublicClient,
  type WalletClient,
} from "viem";
import { sepolia } from "viem/chains";
import { SEPOLIA_CHAIN_ID } from "@/config/chain";

// ─── Types ────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

// ─── Clients (lazily created) ─────────────────────────────────────────────────

let _publicClient: PublicClient | null = null;
let _walletClient: WalletClient | null = null;

export function getPublicClient(): PublicClient {
  if (!_publicClient) {
    _publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });
  }
  return _publicClient;
}

export function getWalletClient(): WalletClient | null {
  if (!window.ethereum) return null;
  if (!_walletClient) {
    _walletClient = createWalletClient({
      chain: sepolia,
      transport: custom(window.ethereum),
    });
  }
  return _walletClient;
}

// ─── MetaMask helpers ─────────────────────────────────────────────────────────

export function isMetaMaskInstalled(): boolean {
  return typeof window !== "undefined" && !!window.ethereum?.isMetaMask;
}

export async function connectWallet(): Promise<string> {
  if (!window.ethereum) throw new Error("MetaMask is not installed");
  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];
  if (!accounts || accounts.length === 0)
    throw new Error("No accounts returned");
  return accounts[0];
}

export async function getConnectedAccounts(): Promise<string[]> {
  if (!window.ethereum) return [];
  const accounts = (await window.ethereum.request({
    method: "eth_accounts",
  })) as string[];
  return accounts ?? [];
}

export async function getCurrentChainId(): Promise<number> {
  if (!window.ethereum) return 0;
  const chainIdHex = (await window.ethereum.request({
    method: "eth_chainId",
  })) as string;
  return parseInt(chainIdHex, 16);
}

export async function switchToSepolia(): Promise<void> {
  if (!window.ethereum) throw new Error("MetaMask is not installed");
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
    });
  } catch (err: unknown) {
    // Chain not added — add it
    const switchErr = err as { code?: number };
    if (switchErr.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
            chainName: "Sepolia",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

export function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function onAccountsChanged(
  handler: (accounts: string[]) => void
): () => void {
  if (!window.ethereum) return () => {};
  const listener = (...args: unknown[]) =>
    handler(args[0] as string[]);
  window.ethereum.on("accountsChanged", listener);
  return () => window.ethereum?.removeListener("accountsChanged", listener);
}

export function onChainChanged(
  handler: (chainId: number) => void
): () => void {
  if (!window.ethereum) return () => {};
  const listener = (...args: unknown[]) =>
    handler(parseInt(args[0] as string, 16));
  window.ethereum.on("chainChanged", listener);
  return () => window.ethereum?.removeListener("chainChanged", listener);
}
