"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/stores/settings-store";
import { exporters, exportToCSV, type TaxPlatform } from "@/lib/csv-export";
import { Download, Loader2 } from "lucide-react";
import Image from "next/image";

const platformIcons: Record<TaxPlatform, string> = {
  koinly: "/platforms/koinly.png",
  cointracker: "/platforms/cointracker.png",
  coinledger: "/platforms/coinledger.png",
  taxbit: "/platforms/taxbit.png",
  tokentax: "/platforms/tokentax.png",
  accointing: "/platforms/accointing.png",
  zenledger: "/platforms/zenledger.png",
  "crypto-tax-calculator": "/platforms/crypto-tax-calculator.png",
  "tres-finance": "/platforms/tres-finance.png",
  cryptio: "/platforms/cryptio.png",
};
import { toast } from "sonner";

interface ExportDialogProps {
  filters: {
    chain?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  };
  disabled?: boolean;
}

export function ExportDialog({ filters, disabled }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<TaxPlatform | null>(null);
  const [progress, setProgress] = useState(0);
  const [expandMultiAsset, setExpandMultiAsset] = useState(false);

  const { octavApiKey, activeAddress } = useSettingsStore();
  const walletAddresses = activeAddress ? [activeAddress] : [];

  const handleExport = async (platform: TaxPlatform) => {
    setExporting(platform);
    setProgress(0);
    try {
      const count = await exportToCSV(
        platform,
        octavApiKey,
        walletAddresses,
        { ...filters, expandMultiAsset },
        (fetched) => setProgress(fetched)
      );
      toast.success(`Exported ${count} transactions to ${exporters[platform].label}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export failed"
      );
    } finally {
      setExporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Transactions</DialogTitle>
          <DialogDescription>
            Choose a tax platform format to download your transactions
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 pb-2">
          <input
            type="checkbox"
            id="expand"
            checked={expandMultiAsset}
            onChange={(e) => setExpandMultiAsset(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="expand" className="text-sm">
            Expand multi-asset transactions (one row per asset)
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(exporters) as TaxPlatform[]).map((platform) => {
            const exp = exporters[platform];
            const isActive = exporting === platform;
            return (
              <Card
                key={platform}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => !exporting && handleExport(platform)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <Image
                    src={platformIcons[platform]}
                    alt={exp.label}
                    width={28}
                    height={28}
                    className="rounded-full object-contain shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{exp.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {exp.headers.length} columns
                    </p>
                  </div>
                  {isActive ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs">{progress} txs</span>
                    </div>
                  ) : (
                    <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
