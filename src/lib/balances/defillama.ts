// Historical token pricing via DefiLlama's free coins API.
// https://coins.llama.fi/prices/historical/{unixSeconds}/{chain:address,...}
//
// CORS is open (access-control-allow-origin: *), so we call it directly from
// the browser — no proxy needed. No API key required.

const BASE_URL = "https://coins.llama.fi";
const NATIVE_ADDRESS = "0x0000000000000000000000000000000000000000";
const CHUNK_SIZE = 60; // coins per request (keep URL length sane)

// Octav chainKey → DefiLlama chain identifier. Most match; these differ.
const CHAIN_MAP: Record<string, string> = {
  avalanche: "avax",
  gnosis: "xdai",
  bsc: "bsc",
};

function llamaChain(chainKey: string): string {
  return CHAIN_MAP[chainKey.toLowerCase()] ?? chainKey.toLowerCase();
}

// Build a DefiLlama coin id from a chain + contract. Native gas tokens (no
// contract) use the per-chain zero-address convention, which DefiLlama prices.
export function buildCoinId(chainKey: string, contract: string): string {
  const addr = contract && contract.startsWith("0x") ? contract.toLowerCase() : NATIVE_ADDRESS;
  return `${llamaChain(chainKey)}:${addr}`;
}

interface LlamaHistoricalResponse {
  coins: Record<string, { price: number; symbol: string; timestamp: number; confidence: number }>;
}

// Fetch USD unit prices for the given coin ids at a unix timestamp (seconds).
// Returns a map of coinId → price; coins without a known price are omitted.
export async function fetchHistoricalPrices(
  coinIds: string[],
  unixSeconds: number
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const unique = [...new Set(coinIds)];

  for (let i = 0; i < unique.length; i += CHUNK_SIZE) {
    const chunk = unique.slice(i, i + CHUNK_SIZE);
    const url = `${BASE_URL}/prices/historical/${unixSeconds}/${chunk.join(",")}`;
    const res = await fetch(url);
    if (!res.ok) continue; // skip failed chunk rather than fail the whole view
    const data: LlamaHistoricalResponse = await res.json();
    for (const [coinId, info] of Object.entries(data.coins || {})) {
      if (typeof info.price === "number") result.set(coinId, info.price);
    }
  }

  return result;
}
