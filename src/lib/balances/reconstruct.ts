import type { Transaction } from "@/types/octav";
import { getNativeToken } from "@/lib/csv-export/chain-native-token";

// Reconstructs an address's token holdings at any point in time from its
// transaction history, broken down per chain. Amounts only (no pricing).
//
// Each leg of `assetsIn` / `assetsOut` carries a human-readable `balance`
// (already decimal-adjusted) framed from the wallet's perspective. Summing the
// signed deltas (in = +, out = −) up to a chosen timestamp yields the holdings
// at that moment. Gas fees are not always a separate asset leg, so we subtract
// `tx.fees` from the chain's native token whenever the wallet is the sender.

export interface TokenBalance {
  key: string; // `${symbol}:${chainKey}`
  symbol: string;
  chainKey: string;
  imgUrl: string | null;
  amount: number;
}

export interface ChainBalances {
  chainKey: string;
  chainName: string;
  chainImg: string | null;
  tokens: TokenBalance[];
}

interface Delta {
  ts: number; // ms
  key: string;
  symbol: string;
  chainKey: string;
  imgUrl: string | null;
  delta: number;
}

interface ChainMeta {
  name: string;
  img: string | null;
}

export interface BalanceDeltas {
  deltas: Delta[]; // sorted ascending by ts
  chainMeta: Map<string, ChainMeta>;
  earliest: number;
  latest: number;
}

function tokenKey(symbol: string, chainKey: string): string {
  return `${symbol}:${chainKey}`;
}

// Normalize the full tx history into a sorted, signed delta stream. Memoize the
// result (keyed on transactions + wallet) and fold it with `reconstructAt`.
export function buildDeltas(
  transactions: Transaction[],
  walletAddress: string
): BalanceDeltas {
  const wallet = walletAddress.toLowerCase().trim();
  const deltas: Delta[] = [];
  const chainMeta = new Map<string, ChainMeta>();

  for (const tx of transactions) {
    // Timestamp is UNIX epoch in seconds (string)
    const ts = parseInt(tx.timestamp, 10) * 1000;
    if (isNaN(ts) || ts <= 0) continue;

    const txChainKey = tx.chain?.key || "unknown";
    if (tx.chain && !chainMeta.has(txChainKey)) {
      chainMeta.set(txChainKey, {
        name: tx.chain.name || txChainKey,
        img: tx.chain.imgSmall || null,
      });
    }

    for (const asset of tx.assetsIn || []) {
      if (asset.isNativeAssetFees) continue;
      const symbol = asset.symbol?.trim();
      if (!symbol) continue;
      const chainKey = asset.chainKey || txChainKey;
      const amount = parseFloat(asset.balance);
      if (!isNaN(amount) && amount !== 0) {
        deltas.push({
          ts,
          key: tokenKey(symbol, chainKey),
          symbol,
          chainKey,
          imgUrl: asset.imgSmall || null,
          delta: amount,
        });
      }
    }

    for (const asset of tx.assetsOut || []) {
      if (asset.isNativeAssetFees) continue;
      const symbol = asset.symbol?.trim();
      if (!symbol) continue;
      const chainKey = asset.chainKey || txChainKey;
      const amount = parseFloat(asset.balance);
      if (!isNaN(amount) && amount !== 0) {
        deltas.push({
          ts,
          key: tokenKey(symbol, chainKey),
          symbol,
          chainKey,
          imgUrl: asset.imgSmall || null,
          delta: -amount,
        });
      }
    }

    // Gas: the wallet only pays fees when it is the sender. The native-fee asset
    // leg (isNativeAssetFees) is skipped above, so subtracting tx.fees here
    // counts the fee exactly once.
    const from = tx.from?.toLowerCase().trim() ?? "";
    if (from === wallet) {
      const fees = parseFloat(tx.fees);
      if (!isNaN(fees) && fees > 0) {
        const nativeSymbol = getNativeToken(txChainKey);
        deltas.push({
          ts,
          key: tokenKey(nativeSymbol, txChainKey),
          symbol: nativeSymbol,
          chainKey: txChainKey,
          imgUrl: null,
          delta: -fees,
        });
      }
    }
  }

  deltas.sort((a, b) => a.ts - b.ts);

  return {
    deltas,
    chainMeta,
    earliest: deltas.length > 0 ? deltas[0].ts : 0,
    latest: deltas.length > 0 ? deltas[deltas.length - 1].ts : 0,
  };
}

// Fold deltas with ts <= atTimeMs into per-token running balances.
export function reconstructAt(
  { deltas }: BalanceDeltas,
  atTimeMs: number
): Map<string, TokenBalance> {
  const balances = new Map<string, TokenBalance>();

  for (const d of deltas) {
    if (d.ts > atTimeMs) break; // deltas are sorted ascending
    const existing = balances.get(d.key);
    if (existing) {
      existing.amount += d.delta;
      if (!existing.imgUrl && d.imgUrl) existing.imgUrl = d.imgUrl;
    } else {
      balances.set(d.key, {
        key: d.key,
        symbol: d.symbol,
        chainKey: d.chainKey,
        imgUrl: d.imgUrl,
        amount: d.delta,
      });
    }
  }

  return balances;
}

// Group token balances by chain, dropping dust, for display.
export function groupByChain(
  balances: Map<string, TokenBalance>,
  chainMeta: Map<string, ChainMeta>,
  { dustThreshold }: { dustThreshold: number }
): { chains: ChainBalances[]; hiddenCount: number } {
  const byChain = new Map<string, TokenBalance[]>();
  let hiddenCount = 0;

  for (const token of balances.values()) {
    if (Math.abs(token.amount) < dustThreshold) {
      hiddenCount++;
      continue;
    }
    const list = byChain.get(token.chainKey);
    if (list) list.push(token);
    else byChain.set(token.chainKey, [token]);
  }

  const chains: ChainBalances[] = [...byChain.entries()].map(
    ([chainKey, tokens]) => {
      tokens.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
      const meta = chainMeta.get(chainKey);
      return {
        chainKey,
        chainName: meta?.name || chainKey,
        chainImg: meta?.img || null,
        tokens,
      };
    }
  );

  // Most-populated chains first
  chains.sort((a, b) => b.tokens.length - a.tokens.length);

  return { chains, hiddenCount };
}
