/**
 * useProposals — loads and refreshes proposals from the contract.
 */

import { useState, useCallback, useEffect } from "react";
import { getAllProposals } from "@/services/contract";
import type { Proposal } from "@/types";

interface UseProposalsReturn {
  proposals: Proposal[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProposals(): UseProposalsReturn {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllProposals();
      // Newest first
      setProposals([...data].reverse());
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Failed to load proposals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { proposals, loading, error, refresh };
}
