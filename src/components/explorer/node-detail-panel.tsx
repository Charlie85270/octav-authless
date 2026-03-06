"use client";

import { useMemo } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GraphData } from "@/lib/explorer/types";
import type { Transaction, TransactionAsset } from "@/types/octav";

interface NodeDetailPanelProps {
  graphData: GraphData;
  selectedNodeId: string;
  walletAddress: string;
  transactions: Transaction[];
  onBack: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  wallet: "#00d4aa",
  token: "#ffa657",
  protocol: "#bc8cff",
  contract: "#58a6ff",
};

function formatDate(timestamp: string): string {
  // Timestamp may be unix seconds (numeric string) or ISO string
  const num = Number(timestamp);
  const d = isNaN(num) ? new Date(timestamp) : new Date(num * 1000);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function formatValue(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  if (Math.abs(v) >= 1) return `$${v.toFixed(2)}`;
  if (v === 0) return "$0";
  return `$${v.toFixed(2)}`;
}

export function NodeDetailPanel({
  graphData,
  selectedNodeId,
  walletAddress,
  transactions,
  onBack,
}: NodeDetailPanelProps) {
  const node = useMemo(
    () => graphData.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [graphData, selectedNodeId]
  );

  const isProtocol = selectedNodeId.startsWith("protocol:");

  const filteredTxs = useMemo(() => {
    if (isProtocol) {
      const protocolKey = selectedNodeId.replace("protocol:", "");
      return transactions.filter((tx) => tx.protocol?.key === protocolKey);
    }
    const nodeAddress = selectedNodeId.toLowerCase();
    return transactions.filter(
      (tx) =>
        tx.from?.toLowerCase() === nodeAddress ||
        tx.to?.toLowerCase() === nodeAddress
    );
  }, [transactions, selectedNodeId, isProtocol]);

  // Sort by timestamp descending (most recent first)
  const sortedTxs = useMemo(
    () => [...filteredTxs].sort((a, b) => Number(b.timestamp) - Number(a.timestamp)),
    [filteredTxs]
  );

  return (
    <div className="flex flex-col w-full lg:w-[340px] h-full border-l bg-card shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b">
        <button
          onClick={onBack}
          className="p-1 rounded hover:bg-accent transition-colors shrink-0"
          aria-label="Back to list"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        {node?.imgUrl ? (
          <img
            src={node.imgUrl}
            alt=""
            className="w-5 h-5 rounded-full shrink-0 object-cover"
          />
        ) : (
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: TYPE_COLORS[node?.type ?? "contract"] }}
          />
        )}
        <span
          className={cn(
            "text-sm text-foreground truncate",
            node?.imgUrl ? "font-sans font-medium" : "font-mono"
          )}
        >
          {node?.label ?? selectedNodeId}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground uppercase shrink-0">
          {node?.type ?? "address"}
        </span>
      </div>

      {/* Transaction count */}
      <div className="px-3 py-1.5 border-b text-[11px] text-muted-foreground">
        {sortedTxs.length} transaction{sortedTxs.length !== 1 ? "s" : ""}
      </div>

      {/* Transaction list */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="divide-y divide-border">
          {sortedTxs.map((tx) => (
            <TxRow key={tx.hash} tx={tx} />
          ))}
          {sortedTxs.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No transactions found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function TxRow({ tx }: { tx: Transaction }) {
  return (
    <div className="px-3 py-2 space-y-1.5 hover:bg-accent/30 transition-colors">
      {/* Top row: type + date + explorer link */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-foreground truncate">
          {tx.type}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
          {formatDate(tx.timestamp)}
        </span>
        {tx.explorerUrl && (
          <a
            href={tx.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Assets */}
      <div className="space-y-1">
        {tx.assetsIn.map((a, i) => (
          <AssetRow key={`in-${i}`} asset={a} direction="in" />
        ))}
        {tx.assetsOut
          .filter((a) => !a.isNativeAssetFees)
          .map((a, i) => (
            <AssetRow key={`out-${i}`} asset={a} direction="out" />
          ))}
      </div>

      {/* Chain */}
      {tx.chain && (
        <div className="flex items-center gap-1 justify-end">
          {tx.chain.imgSmall && (
            <img src={tx.chain.imgSmall} alt="" className="w-3 h-3 rounded-full shrink-0" />
          )}
          <span className="text-[10px] text-muted-foreground">{tx.chain.name}</span>
        </div>
      )}
    </div>
  );
}

function AssetRow({ asset, direction }: { asset: TransactionAsset; direction: "in" | "out" }) {
  const balance = parseFloat(asset.balance);
  const dollarValue = parseFloat(asset.value) || 0;
  const isIn = direction === "in";

  return (
    <div className="flex items-center gap-1.5 pl-1">
      {asset.imgSmall && (
        <img src={asset.imgSmall} alt="" className="w-4 h-4 rounded-full shrink-0 object-cover" />
      )}
      <span className={cn("text-[11px]", isIn ? "text-green-400" : "text-red-400")}>
        {isIn ? "+" : "-"}
        {balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {asset.symbol.toUpperCase()}
      </span>
      {dollarValue > 0 && (
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {formatValue(dollarValue)}
        </span>
      )}
    </div>
  );
}
