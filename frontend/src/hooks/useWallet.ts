/**
 * useWallet — manages MetaMask connection state.
 */

import { useState, useEffect, useCallback } from "react";
import {
  isMetaMaskInstalled,
  connectWallet,
  getConnectedAccounts,
  getCurrentChainId,
  switchToSepolia,
  onAccountsChanged,
  onChainChanged,
  shortenAddress,
} from "@/services/wallet";
import { isMember } from "@/services/contract";
import { SEPOLIA_CHAIN_ID, CONTRACT_ADDRESS } from "@/config/chain";
import type { WalletState } from "@/types";
import type { Address } from "viem";

interface UseWalletReturn {
  wallet: WalletState;
  metamaskInstalled: boolean;
  isCorrectNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  refreshMembership: () => Promise<void>;
  shortened: string;
}

export function useWallet(): UseWalletReturn {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    connected: false,
    isMember: null,
  });

  const metamaskInstalled = isMetaMaskInstalled();

  const checkMembership = useCallback(async (address: string) => {
    if (!CONTRACT_ADDRESS || !address) return;
    try {
      const member = await isMember(address as Address);
      setWallet((prev) => ({ ...prev, isMember: member }));
    } catch {
      // Contract not deployed yet — don't crash
      setWallet((prev) => ({ ...prev, isMember: null }));
    }
  }, []);

  const updateWallet = useCallback(
    async (address: string | null, chainId: number | null) => {
      setWallet({
        address,
        chainId,
        connected: !!address,
        isMember: null,
      });
      if (address) {
        await checkMembership(address);
      }
    },
    [checkMembership]
  );

  // Restore existing connection on mount
  useEffect(() => {
    if (!metamaskInstalled) return;
    (async () => {
      const accounts = await getConnectedAccounts();
      const chainId = await getCurrentChainId();
      if (accounts.length > 0) {
        await updateWallet(accounts[0], chainId);
      } else {
        setWallet((prev) => ({ ...prev, chainId }));
      }
    })();
  }, [metamaskInstalled, updateWallet]);

  // Listen for account/chain changes
  useEffect(() => {
    if (!metamaskInstalled) return;

    const unsubAccounts = onAccountsChanged(async (accounts) => {
      const chainId = await getCurrentChainId();
      if (accounts.length === 0) {
        await updateWallet(null, chainId);
      } else {
        await updateWallet(accounts[0], chainId);
      }
    });

    const unsubChain = onChainChanged(async (newChainId) => {
      const accounts = await getConnectedAccounts();
      await updateWallet(accounts[0] ?? null, newChainId);
    });

    return () => {
      unsubAccounts();
      unsubChain();
    };
  }, [metamaskInstalled, updateWallet]);

  const connect = useCallback(async () => {
    if (!metamaskInstalled) throw new Error("MetaMask is not installed");
    const address = await connectWallet();
    const chainId = await getCurrentChainId();
    await updateWallet(address, chainId);
  }, [metamaskInstalled, updateWallet]);

  const disconnect = useCallback(() => {
    setWallet({ address: null, chainId: null, connected: false, isMember: null });
  }, []);

  const switchNetwork = useCallback(async () => {
    await switchToSepolia();
  }, []);

  const refreshMembership = useCallback(async () => {
    if (wallet.address) {
      await checkMembership(wallet.address);
    }
  }, [wallet.address, checkMembership]);

  return {
    wallet,
    metamaskInstalled,
    isCorrectNetwork: wallet.chainId === SEPOLIA_CHAIN_ID,
    connect,
    disconnect,
    switchNetwork,
    refreshMembership,
    shortened: wallet.address ? shortenAddress(wallet.address) : "",
  };
}
