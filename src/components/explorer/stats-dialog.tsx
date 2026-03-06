"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, Share2 } from "lucide-react";
import BlockiesSvg from "blockies-react-svg";
import { toPng } from "html-to-image";
import type { GraphData } from "@/lib/explorer/types";
import type { Transaction } from "@/types/octav";

interface StatsDialogProps {
  graphData: GraphData;
  transactions: Transaction[];
  walletAddress: string;
}

function formatValue(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
}

function truncateAddress(addr: string): string {
  return addr.length > 16 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
}

export function StatsDialog({
  graphData,
  transactions,
  walletAddress,
}: StatsDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { stats } = graphData;

  // Inline the banner SVG markup (foreignObject + backdrop-filter breaks <img> and data-URI)
  const [bannerSvg, setBannerSvg] = useState("");
  useEffect(() => {
    fetch("/banner.svg")
      .then((r) => r.text())
      .then(setBannerSvg)
      .catch(() => { });
  }, []);

  const computed = useMemo(() => {
    const totalVolume = stats.totalValueIn + stats.totalValueOut;

    const protocolNodes = graphData.nodes.filter((n) => n.type === "protocol");
    const preferredProtocol =
      protocolNodes.length > 0
        ? protocolNodes.reduce((a, b) => (b.txCount > a.txCount ? b : a))
        : null;

    const preferredAsset =
      graphData.tokens.length > 0
        ? graphData.tokens.reduce((a, b) =>
          b.volumeIn + b.volumeOut > a.volumeIn + a.volumeOut ? b : a
        )
        : null;

    const birthDate = new Date(stats.earliestTx).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return { totalVolume, preferredProtocol, preferredAsset, birthDate };
  }, [graphData, stats]);

  const shareOnX = () => {
    const text = `My wallet stats on with @octavfi :\n${stats.totalTxCount} transactions\n${formatValue(computed.totalVolume)} volume\nSince ${computed.birthDate}`;
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  const saveImage = async () => {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = "octav-stats.png";
    link.href = dataUrl;
    link.click();
  };

  const statCards = [
    { label: "Transactions", value: stats.totalTxCount.toLocaleString() },
    { label: "Fees Paid", value: formatValue(stats.totalFees) },
    { label: "Volume", value: formatValue(computed.totalVolume) },
    {
      label: "Top Protocol",
      value: computed.preferredProtocol?.label ?? "N/A",
      imgUrl: computed.preferredProtocol?.imgUrl,
    },
    {
      label: "Top Asset",
      value: computed.preferredAsset?.symbol ?? "N/A",
      imgUrl: computed.preferredAsset?.imgUrl,
    },
    { label: "Birth Date", value: computed.birthDate },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 bg-card/80 backdrop-blur-sm"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Stats
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Wallet Stats</DialogTitle>
        {/* Capturable card */}
        <div ref={cardRef} className="relative p-6 overflow-hidden">
          {/* Banner background — inlined so foreignObject/backdrop-filter renders */}
          {bannerSvg && (
            <div
              className="absolute inset-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:object-cover"
              dangerouslySetInnerHTML={{ __html: bannerSvg }}
            />
          )}
          {/* Dark overlay — lighter so banner bleeds through */}
          <div className="absolute inset-0 bg-black/35" />

          <div className="relative z-10">
            {/* Address row */}
            <div className="flex items-center gap-3 mb-6">
              <BlockiesSvg
                address={walletAddress}
                className="h-10 w-10 rounded-full ring-2 ring-white/20"
              />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Wallet Stats
                </p>
                <p className="font-mono text-sm" style={{ color: "white" }}>
                  {truncateAddress(walletAddress)}
                </p>
              </div>
            </div>

            {/* 2x3 stat grid */}
            <div className="grid grid-cols-3 gap-3">
              {statCards.map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  <p
                    className="text-[10px] font-medium uppercase tracking-wider mb-1"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {s.label}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {s.imgUrl && (
                      <img
                        src={s.imgUrl}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    )}
                    <p className="font-semibold text-sm truncate" style={{ color: "white" }}>
                      {s.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Branding */}
            <p className="text-[10px] text-center mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>
              octav.fi
            </p>
          </div>
        </div>

        {/* Action buttons (outside capturable area) */}
        <div className="flex gap-2 px-6 pb-6 pt-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={shareOnX}>
            <Share2 className="h-4 w-4" />
            Share on X
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={saveImage}>
            <Download className="h-4 w-4" />
            Save Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
