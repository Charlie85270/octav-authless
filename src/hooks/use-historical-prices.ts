"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchHistoricalPrices } from "@/lib/balances/defillama";

// Fetches DefiLlama USD prices for the given coin ids at a point in time.
// Rounds the timestamp to the day so re-scrubbing nearby times hits the cache
// (staleTime: Infinity keeps each day's result for the session).
export function useHistoricalPrices(coinIds: string[], timeMs: number) {
  const dayTs = timeMs > 0 ? Math.floor(timeMs / 86_400_000) * 86_400 : 0;
  const sorted = [...new Set(coinIds)].sort();

  const query = useQuery({
    queryKey: ["llama-historical-prices", dayTs, sorted.join(",")],
    queryFn: () => fetchHistoricalPrices(sorted, dayTs),
    enabled: sorted.length > 0 && dayTs > 0,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  });

  return {
    prices: query.data ?? EMPTY,
    isFetching: query.isFetching,
  };
}

const EMPTY = new Map<string, number>();
