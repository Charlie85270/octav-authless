import type { Transaction } from "@/types/octav";
import type { GraphNode, GraphEdge, GraphData, NodeType, EdgeDirection, TokenEntry } from "./types";

const LABEL_LEN = 6;

function truncateAddress(addr: string): string {
  if (addr.length <= LABEL_LEN * 2 + 2) return addr;
  return `${addr.slice(0, LABEL_LEN)}...${addr.slice(-4)}`;
}

interface CounterpartyAccum {
  label: string;
  imgUrl: string | null;
  txCount: number;
  volumeIn: number;
  volumeOut: number;
  pnl: number;
  firstSeen: number;
  lastSeen: number;
  chains: Set<string>;
  type: NodeType;
  inCount: number;
  outCount: number;
  totalEdgeValue: number;
  edgeFirstSeen: number;
  edgeLastSeen: number;
}

function accumulateCounterparty(
  map: Map<string, CounterpartyAccum>,
  id: string,
  label: string,
  imgUrl: string | null,
  type: NodeType,
  isInflow: boolean,
  valueFiat: number,
  pnl: number,
  ts: number,
  chainKey: string
) {
  const existing = map.get(id);
  if (existing) {
    existing.txCount++;
    if (isInflow) {
      existing.volumeIn += valueFiat;
      existing.inCount++;
    } else {
      existing.volumeOut += valueFiat;
      existing.outCount++;
    }
    existing.pnl += pnl;
    existing.firstSeen = Math.min(existing.firstSeen, ts);
    existing.lastSeen = Math.max(existing.lastSeen, ts);
    existing.chains.add(chainKey);
    existing.totalEdgeValue += valueFiat;
    existing.edgeFirstSeen = Math.min(existing.edgeFirstSeen, ts);
    existing.edgeLastSeen = Math.max(existing.edgeLastSeen, ts);
    // Upgrade label if we get a better one (named > truncated address)
    if (label && !label.includes("...") && existing.label.includes("...")) {
      existing.label = label;
    }
    if (imgUrl && !existing.imgUrl) {
      existing.imgUrl = imgUrl;
    }
  } else {
    map.set(id, {
      label,
      imgUrl,
      txCount: 1,
      volumeIn: isInflow ? valueFiat : 0,
      volumeOut: isInflow ? 0 : valueFiat,
      pnl,
      firstSeen: ts,
      lastSeen: ts,
      chains: new Set([chainKey]),
      type,
      inCount: isInflow ? 1 : 0,
      outCount: isInflow ? 0 : 1,
      totalEdgeValue: valueFiat,
      edgeFirstSeen: ts,
      edgeLastSeen: ts,
    });
  }
}

export function processTransactions(
  transactions: Transaction[],
  walletAddress: string
): GraphData {
  const wallet = walletAddress.toLowerCase();
  const counterparties = new Map<string, CounterpartyAccum>();
  const tokenAccum = new Map<string, { symbol: string; chainKey: string; imgUrl: string | null; txCount: number; volumeIn: number; volumeOut: number; pnl: number; firstSeen: number; lastSeen: number }>();
  const chainImages: Record<string, string> = {};

  let skippedCount = 0;
  let totalFees = 0;

  for (const tx of transactions) {
    // Timestamp is UNIX epoch in seconds (string)
    const ts = parseInt(tx.timestamp, 10) * 1000;
    if (isNaN(ts) || ts <= 0) {
      skippedCount++;
      continue;
    }

    const from = tx.from?.toLowerCase().trim() ?? "";
    const to = tx.to?.toLowerCase().trim() ?? "";
    if (from === wallet) {
      totalFees += parseFloat(tx.feesFiat) || 0;
    }
    const chainKey = tx.chain?.key ?? "unknown";
    if (tx.chain?.imgSmall && !chainImages[chainKey]) {
      chainImages[chainKey] = tx.chain.imgSmall;
    }
    const valueFiat = parseFloat(tx.valueFiat) || 0;

    // Calculate PnL from assets
    let txPnl = 0;
    for (const asset of tx.assetsIn || []) {
      txPnl += parseFloat(asset.closedPnl) || 0;
    }
    for (const asset of tx.assetsOut || []) {
      txPnl += parseFloat(asset.closedPnl) || 0;
    }

    // Calculate volume from assets (more accurate than tx.valueFiat for swaps)
    let assetVolumeIn = 0;
    let assetVolumeOut = 0;
    for (const asset of tx.assetsIn || []) {
      assetVolumeIn += parseFloat(asset.value) || 0;
    }
    for (const asset of tx.assetsOut || []) {
      if (!asset.isNativeAssetFees) {
        assetVolumeOut += parseFloat(asset.value) || 0;
      }
    }
    const totalVolume = valueFiat || Math.max(assetVolumeIn, assetVolumeOut);

    // --- Accumulate tokens from assets (keyed by symbol + chain) ---
    const txTokensSeen = new Set<string>();
    for (const asset of [...(tx.assetsIn || []), ...(tx.assetsOut || [])]) {
      if (asset.isNativeAssetFees) continue;
      const symbol = asset.symbol?.trim();
      if (!symbol) continue;
      const assetChain = asset.chainKey || chainKey;
      const tokenKey = `${symbol}:${assetChain}`;
      const vol = parseFloat(asset.value) || 0;
      const pnl = parseFloat(asset.closedPnl) || 0;
      const isIn = asset.isAssetIn !== undefined ? asset.isAssetIn : (tx.assetsIn || []).includes(asset);
      const existing = tokenAccum.get(tokenKey);
      // Only count txCount once per tx per token
      const firstInTx = !txTokensSeen.has(tokenKey);
      txTokensSeen.add(tokenKey);
      if (existing) {
        if (firstInTx) existing.txCount++;
        if (isIn) existing.volumeIn += vol; else existing.volumeOut += vol;
        existing.pnl += pnl;
        existing.firstSeen = Math.min(existing.firstSeen, ts);
        existing.lastSeen = Math.max(existing.lastSeen, ts);
        if (!existing.imgUrl && asset.imgSmall) existing.imgUrl = asset.imgSmall;
      } else {
        tokenAccum.set(tokenKey, {
          symbol,
          chainKey: assetChain,
          imgUrl: asset.imgSmall || null,
          txCount: 1,
          volumeIn: isIn ? vol : 0,
          volumeOut: isIn ? 0 : vol,
          pnl,
          firstSeen: ts,
          lastSeen: ts,
        });
      }
    }

    // --- Strategy 1: tx-level from/to counterparty ---
    let txCounterparty: string | null = null;
    let txIsInflow = false;

    if (from === wallet && to && to !== wallet) {
      txCounterparty = to;
      txIsInflow = false;
    } else if (to === wallet && from && from !== wallet) {
      txCounterparty = from;
      txIsInflow = true;
    }

    if (txCounterparty) {
      // Determine node type from protocol and tx type
      let nodeType: NodeType = "contract";
      let label = truncateAddress(txCounterparty);
      let imgUrl: string | null = null;

      const isRealProtocol =
        tx.protocol?.key &&
        tx.protocol.key !== "unknown" &&
        tx.protocol.name &&
        tx.protocol.name.toLowerCase() !== "wallet";

      if (isRealProtocol) {
        nodeType = "protocol";
        label = tx.protocol.name;
        imgUrl = tx.protocol.imgSmall || null;
      }

      accumulateCounterparty(
        counterparties,
        txCounterparty,
        label,
        imgUrl,
        nodeType,
        txIsInflow,
        totalVolume,
        txPnl,
        ts,
        chainKey
      );
      continue; // Found tx-level counterparty, move on
    }

    // --- Strategy 2: Extract counterparties from asset-level from/to ---
    // For self-interactions or when tx from/to don't reveal counterparty
    const assetCounterparties = new Set<string>();

    for (const asset of tx.assetsIn || []) {
      const assetFrom = asset.from?.toLowerCase().trim();
      if (assetFrom && assetFrom !== wallet) {
        assetCounterparties.add(assetFrom);
      }
    }
    for (const asset of tx.assetsOut || []) {
      const assetTo = asset.to?.toLowerCase().trim();
      if (assetTo && assetTo !== wallet) {
        assetCounterparties.add(assetTo);
      }
    }

    if (assetCounterparties.size > 0) {
      const perPartyVolume = totalVolume / assetCounterparties.size;
      const perPartyPnl = txPnl / assetCounterparties.size;

      for (const addr of assetCounterparties) {
        let nodeType: NodeType = "contract";
        let label = truncateAddress(addr);
        let imgUrl: string | null = null;

        // Check if this address is a known token contract
        const allAssets = [...(tx.assetsIn || []), ...(tx.assetsOut || [])];
        for (const asset of allAssets) {
          if (asset.contract?.toLowerCase() === addr) {
            nodeType = "token";
            label = asset.symbol || asset.name || label;
            imgUrl = asset.imgSmall || null;
            break;
          }
        }

        // Check protocol (skip "Wallet")
        const isRealProto =
          tx.protocol?.key &&
          tx.protocol.key !== "unknown" &&
          tx.protocol.name &&
          tx.protocol.name.toLowerCase() !== "wallet";
        if (nodeType === "contract" && isRealProto) {
          if (to?.toLowerCase() === addr) {
            nodeType = "protocol";
            label = tx.protocol.name;
            imgUrl = tx.protocol.imgSmall || null;
          }
        }

        // Determine direction from assets
        let isIn = false;
        for (const asset of tx.assetsIn || []) {
          if (asset.from?.toLowerCase().trim() === addr) {
            isIn = true;
            break;
          }
        }

        accumulateCounterparty(
          counterparties,
          addr,
          label,
          imgUrl,
          nodeType,
          isIn,
          perPartyVolume,
          perPartyPnl,
          ts,
          chainKey
        );
      }
      continue;
    }

    // --- Strategy 3: Use protocol as counterparty (skip "Wallet") ---
    if (
      tx.protocol?.key &&
      tx.protocol.key !== "unknown" &&
      tx.protocol.name &&
      tx.protocol.name.toLowerCase() !== "wallet"
    ) {
      const protocolId = `protocol:${tx.protocol.key}`;
      accumulateCounterparty(
        counterparties,
        protocolId,
        tx.protocol.name,
        tx.protocol.imgSmall || null,
        "protocol",
        assetVolumeIn > assetVolumeOut,
        totalVolume,
        txPnl,
        ts,
        chainKey
      );
      continue;
    }

    // --- Strategy 4: Use tx.to even if from/to are both empty or both wallet ---
    if (to && to !== wallet) {
      accumulateCounterparty(
        counterparties,
        to,
        truncateAddress(to),
        null,
        "contract",
        false,
        totalVolume,
        txPnl,
        ts,
        chainKey
      );
    } else if (from && from !== wallet) {
      accumulateCounterparty(
        counterparties,
        from,
        truncateAddress(from),
        null,
        "contract",
        true,
        totalVolume,
        txPnl,
        ts,
        chainKey
      );
    } else {
      skippedCount++;
    }
  }

  if (skippedCount > 0) {
    console.log(`[Explorer] Skipped ${skippedCount}/${transactions.length} transactions (no counterparty found)`);
  }
  console.log(`[Explorer] Processed ${transactions.length} txs → ${counterparties.size} counterparties`);

  // Build nodes
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  let totalValueIn = 0;
  let totalValueOut = 0;
  let earliestTx = Infinity;
  let latestTx = -Infinity;

  // Wallet node (center)
  const walletNode: GraphNode = {
    id: wallet,
    label: truncateAddress(wallet),
    type: "wallet",
    txCount: transactions.length,
    volumeIn: 0,
    volumeOut: 0,
    netPnl: 0,
    firstSeen: Infinity,
    lastSeen: -Infinity,
    chains: new Set(),
    imgUrl: null,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    fx: 0,
    fy: 0,
    width: 130,
    height: 44,
  };

  // Sort counterparties by txCount desc
  const sorted = [...counterparties.entries()].sort(
    (a, b) => b[1].txCount - a[1].txCount
  );

  for (const [addr, data] of sorted) {
    // Widen nodes that have an image to fit icon + label
    const hasImg = !!data.imgUrl;
    const node: GraphNode = {
      id: addr,
      label: data.label,
      type: data.type,
      txCount: data.txCount,
      volumeIn: data.volumeIn,
      volumeOut: data.volumeOut,
      netPnl: data.pnl,
      firstSeen: data.firstSeen,
      lastSeen: data.lastSeen,
      chains: data.chains,
      imgUrl: data.imgUrl,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      fx: null,
      fy: null,
      width: hasImg ? 140 : 120,
      height: 40,
    };
    nodes.push(node);

    let direction: EdgeDirection = "both";
    if (data.inCount > 0 && data.outCount === 0) direction = "in";
    else if (data.outCount > 0 && data.inCount === 0) direction = "out";

    edges.push({
      source: wallet,
      target: addr,
      txCount: data.txCount,
      totalValue: data.totalEdgeValue,
      direction,
      firstSeen: data.edgeFirstSeen,
      lastSeen: data.edgeLastSeen,
    });

    walletNode.volumeIn += data.volumeIn;
    walletNode.volumeOut += data.volumeOut;
    walletNode.netPnl += data.pnl;
    walletNode.firstSeen = Math.min(walletNode.firstSeen, data.firstSeen);
    walletNode.lastSeen = Math.max(walletNode.lastSeen, data.lastSeen);
    for (const chain of data.chains) walletNode.chains.add(chain);

    totalValueIn += data.volumeIn;
    totalValueOut += data.volumeOut;
    earliestTx = Math.min(earliestTx, data.firstSeen);
    latestTx = Math.max(latestTx, data.lastSeen);
  }

  // Build token entries (sidebar-only, not graph nodes)
  const tokenEntries: TokenEntry[] = [...tokenAccum.entries()]
    .sort((a, b) => b[1].txCount - a[1].txCount)
    .map(([key, data]) => ({
      id: `token:${key}`,
      symbol: data.symbol,
      chainKey: data.chainKey,
      imgUrl: data.imgUrl,
      txCount: data.txCount,
      volumeIn: data.volumeIn,
      volumeOut: data.volumeOut,
      netPnl: data.pnl,
      firstSeen: data.firstSeen,
      lastSeen: data.lastSeen,
    }));

  // Fix infinity edge cases
  if (walletNode.firstSeen === Infinity) walletNode.firstSeen = Date.now();
  if (walletNode.lastSeen === -Infinity) walletNode.lastSeen = Date.now();
  if (earliestTx === Infinity) earliestTx = Date.now();
  if (latestTx === -Infinity) latestTx = Date.now();

  nodes.unshift(walletNode);

  return {
    nodes,
    edges,
    walletNodeId: wallet,
    stats: {
      totalTxCount: transactions.length,
      totalCounterparties: counterparties.size,
      totalValueIn,
      totalValueOut,
      totalFees,
      earliestTx,
      latestTx,
    },
    chainImages,
    tokens: tokenEntries,
  };
}
