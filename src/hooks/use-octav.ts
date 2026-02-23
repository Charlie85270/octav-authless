"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSettingsStore } from "@/stores/settings-store";
import * as api from "@/lib/octav-client";
import { useState, useCallback, useRef } from "react";
import { useTransactionsStore } from "@/stores/transactions-store";

function useApiKey() {
  return useSettingsStore((s) => s.octavApiKey);
}

function useAddresses() {
  const addr = useSettingsStore((s) => s.activeAddress);
  return addr ? [addr] : [];
}

// --- FREE endpoints (no credits) ---

export function useCredits() {
  const apiKey = useApiKey();
  return useQuery({
    queryKey: ["credits", apiKey],
    queryFn: () => api.getCredits(apiKey),
    enabled: !!apiKey,
    staleTime: 30_000,
  });
}

export function useStatus() {
  const apiKey = useApiKey();
  const addresses = useAddresses();
  const query = useQuery({
    queryKey: ["status", addresses],
    queryFn: () => api.getStatus(apiKey, addresses),
    enabled: !!apiKey && addresses.length > 0,
    staleTime: 10_000,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && data.some((s) => s.syncInProgress)) return 10_000;
      return false;
    },
  });

  const isSyncing = query.data?.some((s) => s.syncInProgress) ?? false;

  return { ...query, isSyncing };
}

// --- PAID endpoints (1 credit per address) — manual trigger only ---

export function usePortfolio() {
  const apiKey = useApiKey();
  const addresses = useAddresses();
  const [activated, setActivated] = useState(false);

  const query = useQuery({
    queryKey: ["portfolio", addresses],
    queryFn: () => api.getPortfolio(apiKey, addresses),
    enabled: activated && !!apiKey && addresses.length > 0,
    staleTime: 60_000,
  });

  const fetch = useCallback(() => setActivated(true), []);

  return { ...query, fetch, activated };
}

export function useSyncPortfolio() {
  const apiKey = useApiKey();
  const addresses = useAddresses();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.getPortfolio(apiKey, addresses, { waitForSync: true }),
    onSuccess: (data) => {
      // Update the portfolio cache with the fresh synced data
      queryClient.setQueryData(["portfolio", addresses], data);
      queryClient.invalidateQueries({ queryKey: ["status"] });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
  });
}

export function useTransactions(options: {
  chain?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  offset?: number;
  limit?: number;
} = {}) {
  const apiKey = useApiKey();
  const addresses = useAddresses();
  const [activated, setActivated] = useState(false);

  const query = useQuery({
    queryKey: ["transactions", addresses, options],
    queryFn: () => api.getTransactions(apiKey, addresses, options),
    enabled: activated && !!apiKey && addresses.length > 0,
    staleTime: 30_000,
  });

  const fetch = useCallback(() => setActivated(true), []);

  return { ...query, fetch, activated };
}

export function useAllTransactions(filters: {
  chain?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
} = {}) {
  const apiKey = useApiKey();
  const addresses = useAddresses();
  const activeAddress = useSettingsStore((s) => s.activeAddress);
  const setTxCount = useSettingsStore((s) => s.setTxCount);
  const setGlobalTransactions = useTransactionsStore((s) => s.setTransactions);
  const queryClient = useQueryClient();

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const [transactions, setTransactions] = useState<import("@/types/octav").Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activated, setActivated] = useState(false);

  const fetchAll = useCallback(async (): Promise<{ count: number; credits: number } | undefined> => {
    if (!apiKey || addresses.length === 0) return;
    setActivated(true);
    setLoading(true);
    setProgress(0);

    const all: import("@/types/octav").Transaction[] = [];
    const limit = 250;
    let offset = 0;
    let apiCalls = 0;

    try {
      while (true) {
        const result = await api.getTransactions(apiKey, addresses, {
          ...filtersRef.current,
          offset,
          limit,
        });
        apiCalls++;
        all.push(...result.transactions);
        setProgress(all.length);

        if (result.transactions.length < limit) break;
        offset += limit;
      }

      setTransactions(all);
      setGlobalTransactions(all);

      // Save total count to localStorage
      if (activeAddress) {
        setTxCount(activeAddress, all.length);
      }

      // Refresh credits after all the API calls
      queryClient.invalidateQueries({ queryKey: ["credits"] });

      return { count: all.length, credits: apiCalls };
    } finally {
      setLoading(false);
    }
  }, [apiKey, addresses, activeAddress, setTxCount, setGlobalTransactions, queryClient]);

  return { transactions, loading, progress, activated, fetchAll };
}

export function useSyncTransactions() {
  const apiKey = useApiKey();
  const addresses = useAddresses();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.syncTransactions(apiKey, addresses),
    onSuccess: () => {
      // Invalidate status so useStatus picks up syncInProgress and starts auto-polling
      queryClient.invalidateQueries({ queryKey: ["status"] });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
  });
}

export function useValidateApiKey() {
  return useMutation({
    mutationFn: (key: string) => api.getCredits(key),
  });
}
