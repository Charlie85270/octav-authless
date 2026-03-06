"use client";

import { useRef, useEffect } from "react";
import type { GraphNode } from "@/lib/explorer/types";
import { format } from "date-fns";

interface NodeTooltipProps {
  node: GraphNode | null;
  canvasRect: DOMRect | null;
  transform: { x: number; y: number; k: number };
}

function formatValue(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  if (Math.abs(v) >= 1) return `$${v.toFixed(0)}`;
  return `$${v.toFixed(2)}`;
}

export function NodeTooltip({ node, canvasRect, transform }: NodeTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);

  if (!node || !canvasRect) return null;

  // Convert graph coords to screen coords
  const screenX =
    canvasRect.left +
    canvasRect.width / 2 +
    transform.x +
    node.x * transform.k;
  const screenY =
    canvasRect.top +
    canvasRect.height / 2 +
    transform.y +
    (node.y - node.height / 2) * transform.k -
    8;

  const volume = node.volumeIn + node.volumeOut;
  const chains = [...node.chains];

  return (
    <div
      ref={ref}
      className="fixed z-50 pointer-events-none"
      style={{
        left: screenX,
        top: screenY,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl max-w-[280px]">
        {/* Address */}
        <div className="text-xs font-mono text-foreground mb-1 break-all">
          {node.id}
        </div>

        {/* Type badge */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-medium text-muted-foreground uppercase px-1.5 py-0.5 bg-accent rounded">
            {node.type}
          </span>
          {chains.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {chains.join(", ")}
            </span>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
          <span className="text-muted-foreground">Transactions</span>
          <span className="text-foreground text-right tabular-nums">
            {node.txCount}
          </span>

          <span className="text-muted-foreground">Volume</span>
          <span className="text-foreground text-right tabular-nums">
            {volume > 0 ? formatValue(volume) : "—"}
          </span>

          <span className="text-muted-foreground">In / Out</span>
          <span className="text-foreground text-right tabular-nums">
            {formatValue(node.volumeIn)} / {formatValue(node.volumeOut)}
          </span>

          <span className="text-muted-foreground">PnL</span>
          <span
            className={`text-right tabular-nums ${
              node.netPnl > 0
                ? "text-[#3fb950]"
                : node.netPnl < 0
                ? "text-[#f85149]"
                : "text-foreground"
            }`}
          >
            {node.netPnl !== 0 ? formatValue(node.netPnl) : "—"}
          </span>

          <span className="text-muted-foreground">First seen</span>
          <span className="text-foreground text-right">
            {format(new Date(node.firstSeen), "MMM d, yyyy")}
          </span>

          <span className="text-muted-foreground">Last seen</span>
          <span className="text-foreground text-right">
            {format(new Date(node.lastSeen), "MMM d, yyyy")}
          </span>
        </div>
      </div>
    </div>
  );
}
