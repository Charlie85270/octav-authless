"use client";

import { Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { GraphData } from "@/lib/explorer/types";

interface ExplorerHeaderProps {
  graphData: GraphData;
  walletAddress: string;
}

function formatValue(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
}

export function ExplorerHeader({ graphData, walletAddress }: ExplorerHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [walletAddress]);

  const truncated =
    walletAddress.length > 16
      ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`
      : walletAddress;

  const { stats, chainImages } = graphData;
  const totalValue = stats.totalValueIn + stats.totalValueOut;
  const chains = graphData.nodes[0]?.chains;
  const chainList = chains ? [...chains] : [];

  return (
    <div className="flex items-center gap-3 lg:gap-4 border-b bg-card px-3 lg:px-4 py-2 lg:py-2.5 shrink-0">
      {/* Address */}
      <div className="flex items-center gap-1.5 min-w-0 shrink-0">
        <span className="text-sm font-mono text-foreground truncate">{truncated}</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          title="Copy address"
        >
          {copied ? (
            <Check className="h-3 w-3 text-[#3fb950]" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Chain badges — hidden on small mobile */}
      {chainList.length > 0 && (
        <div className="hidden sm:flex items-center gap-1">
          {chainList.slice(0, 5).map((chain) => (
            <span
              key={chain}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-accent rounded text-muted-foreground uppercase"
            >
              {chainImages[chain] && (
                <img
                  src={chainImages[chain]}
                  alt=""
                  className="w-3.5 h-3.5 rounded-full object-cover"
                />
              )}
              {chain}
            </span>
          ))}
          {chainList.length > 5 && (
            <span className="text-[10px] text-muted-foreground">
              +{chainList.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="hidden lg:block w-px h-5 bg-border" />

      {/* Stats — hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex items-center gap-6 lg:gap-8">
        <Stat label="TX Analyzed" value={stats.totalTxCount.toLocaleString()} />
        <Stat label="Counterparties" value={stats.totalCounterparties.toLocaleString()} />
        <Stat label="Total Value" value={formatValue(totalValue)} />
        <Stat label="Fees Paid" value={formatValue(stats.totalFees)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground tabular-nums">
        {value}
      </span>
    </div>
  );
}
