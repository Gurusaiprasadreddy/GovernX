/**
 * useTx — generic transaction lifecycle hook.
 */

import { useState, useCallback } from "react";
import { waitForTx, parseContractError } from "@/services/contract";
import type { TxState } from "@/types";

interface UseTxReturn {
  tx: TxState;
  run: (fn: () => Promise<`0x${string}`>) => Promise<boolean>;
  reset: () => void;
}

export function useTx(): UseTxReturn {
  const [tx, setTx] = useState<TxState>({ status: "idle" });

  const run = useCallback(async (fn: () => Promise<`0x${string}`>): Promise<boolean> => {
    setTx({ status: "confirm" });
    try {
      const hash = await fn();
      setTx({ status: "pending", hash });
      const { success } = await waitForTx(hash);
      if (success) {
        setTx({ status: "confirmed", hash });
        return true;
      } else {
        setTx({ status: "failed", hash, error: "Transaction reverted on-chain" });
        return false;
      }
    } catch (err: unknown) {
      const msg = parseContractError(err);
      setTx({ status: "failed", error: msg });
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setTx({ status: "idle" });
  }, []);

  return { tx, run, reset };
}
