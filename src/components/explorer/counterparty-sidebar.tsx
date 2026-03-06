"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { GraphNode, GraphData, TokenEntry } from "@/lib/explorer/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CounterpartySidebarProps {
  graphData: GraphData;
  activeNodeIds: Set<string>;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
}

type FilterTab = "all" | "wallet" | "token" | "protocol" | "contract";
type SortKey = "txCount" | "volume" | "pnl" | "lastSeen";
type SortDir = "asc" | "desc";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "ALL" },
  { key: "contract", label: "ADDRESSES" },
  { key: "protocol", label: "PROTOCOL" },
  { key: "token", label: "TOKEN" },
];

function formatValue(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  if (Math.abs(v) >= 1) return `$${v.toFixed(0)}`;
  return `$${v.toFixed(2)}`;
}

const TYPE_COLORS: Record<string, string> = {
  wallet: "#00d4aa",
  token: "#ffa657",
  protocol: "#bc8cff",
  contract: "#58a6ff",
};

// Unified row type for both graph nodes and tokens
interface ListRow {
  id: string;
  label: string;
  type: "token" | "protocol" | "contract" | "wallet";
  imgUrl: string | null;
  txCount: number;
  volumeIn: number;
  volumeOut: number;
  netPnl: number;
  // Token-specific
  chainKey?: string;
  chainImgUrl?: string;
}

function sortRows(rows: ListRow[], sortKey: SortKey, sortDir: SortDir): ListRow[] {
  return [...rows].sort((a, b) => {
    let av: number, bv: number;
    switch (sortKey) {
      case "txCount": av = a.txCount; bv = b.txCount; break;
      case "volume": av = a.volumeIn + a.volumeOut; bv = b.volumeIn + b.volumeOut; break;
      case "pnl": av = a.netPnl; bv = b.netPnl; break;
      case "lastSeen": av = a.txCount; bv = b.txCount; break; // fallback
      default: av = a.txCount; bv = b.txCount;
    }
    return sortDir === "desc" ? bv - av : av - bv;
  });
}

export function CounterpartySidebar({
  graphData,
  activeNodeIds,
  selectedNodeId,
  hoveredNodeId,
  onSelectNode,
  onHoverNode,
}: CounterpartySidebarProps) {
  const [tab, setTab] = useState<FilterTab>("all");
  const [sortKey, setSortKey] = useState<SortKey>("txCount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Graph node rows (addresses + protocols)
  const nodeRows = useMemo((): ListRow[] => {
    return graphData.nodes
      .filter((n) => n.id !== graphData.walletNodeId && activeNodeIds.has(n.id))
      .map((n) => ({
        id: n.id,
        label: n.label,
        type: n.type,
        imgUrl: n.imgUrl,
        txCount: n.txCount,
        volumeIn: n.volumeIn,
        volumeOut: n.volumeOut,
        netPnl: n.netPnl,
      }));
  }, [graphData, activeNodeIds]);

  // Token rows from dedicated token list
  const tokenRows = useMemo((): ListRow[] => {
    return graphData.tokens.map((t) => ({
      id: t.id,
      label: t.symbol,
      type: "token" as const,
      imgUrl: t.imgUrl,
      txCount: t.txCount,
      volumeIn: t.volumeIn,
      volumeOut: t.volumeOut,
      netPnl: t.netPnl,
      chainKey: t.chainKey,
      chainImgUrl: graphData.chainImages[t.chainKey] || undefined,
    }));
  }, [graphData]);

  const filteredRows = useMemo(() => {
    let rows: ListRow[];
    if (tab === "token") {
      rows = tokenRows;
    } else if (tab === "all") {
      rows = nodeRows;
    } else {
      rows = nodeRows.filter((r) => r.type === tab);
    }
    return sortRows(rows, sortKey, sortDir);
  }, [nodeRows, tokenRows, tab, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const tabCounts = useMemo(() => {
    const addressCount = nodeRows.filter((r) => r.type === "contract").length;
    const protocolCount = nodeRows.filter((r) => r.type === "protocol").length;
    return {
      all: nodeRows.length,
      wallet: 0,
      token: tokenRows.length,
      protocol: protocolCount,
      contract: addressCount,
    };
  }, [nodeRows, tokenRows]);

  return (
    <div className="flex flex-col w-full lg:w-[340px] h-full border-l bg-card shrink-0 overflow-hidden">
      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-2 py-1 text-[10px] font-medium rounded transition-colors",
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            {t.label} ({tabCounts[t.key]})
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_50px_70px] gap-1 px-3 py-1.5 border-b text-[10px] text-muted-foreground font-medium">
        <span>{tab === "token" ? "Token" : "Address"}</span>
        <button
          onClick={() => handleSort("txCount")}
          className={cn("text-right", sortKey === "txCount" && "text-foreground")}
        >
          TXs {sortKey === "txCount" && (sortDir === "desc" ? "↓" : "↑")}
        </button>
        <button
          onClick={() => handleSort("volume")}
          className={cn("text-right", sortKey === "volume" && "text-foreground")}
        >
          Vol {sortKey === "volume" && (sortDir === "desc" ? "↓" : "↑")}
        </button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="divide-y divide-border">
          {filteredRows.map((row) => (
            <SidebarRow
              key={row.id}
              row={row}
              isSelected={row.id === selectedNodeId}
              isHovered={row.id === hoveredNodeId}
              onClick={() =>
                row.type !== "token"
                  ? onSelectNode(row.id === selectedNodeId ? null : row.id)
                  : undefined
              }
              onMouseEnter={() =>
                row.type !== "token" ? onHoverNode(row.id) : undefined
              }
              onMouseLeave={() =>
                row.type !== "token" ? onHoverNode(null) : undefined
              }
            />
          ))}
          {filteredRows.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No counterparties
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function SidebarRow({
  row,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  row: ListRow;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const volume = row.volumeIn + row.volumeOut;
  const isToken = row.type === "token";

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "grid grid-cols-[1fr_50px_70px] gap-1 w-full px-3 py-2 text-left transition-colors",
        isSelected
          ? "bg-primary/10"
          : isHovered
          ? "bg-accent/50"
          : "hover:bg-accent/30"
      )}
    >
      {/* Name with image */}
      <div className="flex items-center gap-1.5 min-w-0">
        {isToken ? (
          <TokenIcon imgUrl={row.imgUrl} chainImgUrl={row.chainImgUrl} />
        ) : row.imgUrl ? (
          <img
            src={row.imgUrl}
            alt=""
            className="w-4 h-4 rounded-full shrink-0 object-cover"
          />
        ) : (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: TYPE_COLORS[row.type] || "#7d8590" }}
          />
        )}
        {isToken ? (
          <span className="flex items-baseline gap-1 min-w-0 truncate">
            <span className="text-xs font-medium text-foreground uppercase">{row.label}</span>
            {row.chainKey && (
              <span className="text-[10px] text-muted-foreground">({row.chainKey})</span>
            )}
          </span>
        ) : (
          <span className={cn(
            "text-xs text-foreground truncate",
            row.imgUrl ? "font-sans" : "font-mono"
          )}>
            {row.label}
          </span>
        )}
      </div>

      {/* TX count */}
      <span className="text-xs text-muted-foreground text-right tabular-nums">
        {row.txCount}
      </span>

      {/* Volume */}
      <span className="text-xs text-muted-foreground text-right tabular-nums">
        {volume > 0 ? formatValue(volume) : "—"}
      </span>
    </button>
  );
}

function TokenIcon({ imgUrl, chainImgUrl }: { imgUrl: string | null; chainImgUrl?: string }) {
  return (
    <span className="relative w-5 h-5 shrink-0">
      {imgUrl ? (
        <img
          src={imgUrl}
          alt=""
          className="w-5 h-5 rounded-full object-cover"
        />
      ) : (
        <span
          className="block w-5 h-5 rounded-full"
          style={{ backgroundColor: TYPE_COLORS.token }}
        />
      )}
      {chainImgUrl && (
        <img
          src={chainImgUrl}
          alt=""
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full object-cover ring-1 ring-card"
        />
      )}
    </span>
  );
}
