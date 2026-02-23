"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { CreditBalance } from "@/components/dashboard/credit-balance";
import { SyncStatus } from "@/components/dashboard/sync-status";
import { usePortfolio } from "@/hooks/use-octav";
import { useRequireSetup } from "@/hooks/use-require-setup";
import { useSettingsStore } from "@/stores/settings-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, Info } from "lucide-react";
import { SyncingBanner } from "@/components/syncing-banner";
import type { PortfolioEntry, DeFiAsset } from "@/types/octav";

function fmtValue(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n) || n === 0) return "$0.00";
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtBalance(v: string) {
  const n = parseFloat(v);
  if (isNaN(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

// --- Position extraction ---

interface DisplayAsset {
  symbol: string;
  name: string;
  balance: string;
  price: string;
  value: string;
  contract: string;
  imgSmall?: string;
  category?: string;
}

interface DisplayPosition {
  protocolName: string;
  protocolKey: string;
  protocolImg?: string;
  chainName: string;
  chainKey: string;
  chainImg?: string;
  positionLabel: string;
  totalValue: string;
  assets: DisplayAsset[];
  siteUrl?: string;
}

function mapDeFiAsset(a: DeFiAsset, category?: string): DisplayAsset {
  return {
    symbol: a.symbol,
    name: a.name,
    balance: a.balance,
    price: a.price,
    value: a.value,
    contract: a.contract,
    imgSmall: a.imgSmall,
    category,
  };
}

function extractPositions(data: PortfolioEntry[]): DisplayPosition[] {
  const groups: DisplayPosition[] = [];

  for (const entry of data) {
    for (const protocol of Object.values(entry.assetByProtocols)) {
      for (const chain of Object.values(protocol.chains)) {
        for (const [posName, position] of Object.entries(chain.protocolPositions)) {
          const hasDirectAssets = position.assets?.length > 0;
          const hasSubs = position.protocolPositions?.length > 0;

          if (!hasDirectAssets && !hasSubs) continue;

          // Wallet-style: direct assets
          if (hasDirectAssets) {
            groups.push({
              protocolName: protocol.name,
              protocolKey: protocol.key,
              protocolImg: protocol.imgSmall,
              chainName: chain.name,
              chainKey: chain.key,
              chainImg: chain.imgSmall,
              positionLabel: posName,
              totalValue: position.totalValue,
              assets: position.assets.map((a) => ({
                symbol: a.symbol,
                name: a.name,
                balance: a.balance,
                price: a.price,
                value: a.value,
                contract: a.contract,
                imgSmall: a.imgSmall,
              })),
            });
          }

          // DeFi-style: nested sub-positions
          if (hasSubs) {
            for (const sub of position.protocolPositions) {
              const assets: DisplayAsset[] = [];

              for (const a of sub.assets || []) {
                if (parseFloat(a.value) > 0 || parseFloat(a.balance) > 0)
                  assets.push(mapDeFiAsset(a));
              }
              for (const a of sub.supplyAssets || []) {
                if (parseFloat(a.value) > 0 || parseFloat(a.balance) > 0)
                  assets.push(mapDeFiAsset(a, "Supplied"));
              }
              for (const a of sub.borrowAssets || []) {
                if (parseFloat(a.value) > 0 || parseFloat(a.balance) > 0)
                  assets.push(mapDeFiAsset(a, "Borrowed"));
              }
              for (const a of sub.rewardAssets || []) {
                if (parseFloat(a.value) > 0 || parseFloat(a.balance) > 0)
                  assets.push(mapDeFiAsset(a, "Reward"));
              }
              for (const a of sub.dexAssets || []) {
                const margin = parseFloat(a.marginUsed || "0");
                if (margin > 0) {
                  assets.push({
                    symbol: "USDC",
                    name: "Margin Balance",
                    balance: a.marginUsed || "0",
                    price: "1.00",
                    value: a.marginUsed || "0",
                    contract: "",
                    category: "Margin",
                  });
                }
              }

              const subValue = parseFloat(sub.value);
              if (assets.length === 0 && subValue <= 0) continue;

              groups.push({
                protocolName: protocol.name,
                protocolKey: protocol.key,
                protocolImg: protocol.imgSmall,
                chainName: chain.name,
                chainKey: chain.key,
                chainImg: chain.imgSmall,
                positionLabel: `${posName} — ${sub.name}`,
                totalValue: sub.value,
                assets,
                siteUrl: sub.siteUrl,
              });
            }
          }
        }
      }
    }
  }

  groups.sort((a, b) => parseFloat(b.totalValue) - parseFloat(a.totalValue));
  return groups;
}

export default function DashboardPage() {
  useRequireSetup();

  const { data, isLoading, fetch, activated } = usePortfolio();
  const addressCount = useSettingsStore((s) => (s.activeAddress ? 1 : 0));

  const totalNAV = useMemo(() => {
    if (!data) return 0;
    return data.reduce((sum, entry) => sum + parseFloat(entry.networth || "0"), 0);
  }, [data]);

  const positions = useMemo(() => (data ? extractPositions(data) : []), [data]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <SyncingBanner />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* NAV Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Asset Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {!activated ? (
                <p className="text-sm text-muted-foreground">Fetch portfolio to see NAV</p>
              ) : isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">{fmtValue(totalNAV)}</div>
              )}
            </CardContent>
          </Card>

          <CreditBalance />
          <SyncStatus />
        </div>

        {/* Full Portfolio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            {!activated ? (
              <div className="flex items-center justify-between rounded-md bg-muted/50 p-4">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Fetching portfolio costs{" "}
                    <span className="font-medium text-foreground">
                      {addressCount} credit{addressCount !== 1 ? "s" : ""}
                    </span>{" "}
                    (${(addressCount * 0.025).toFixed(3)}) — includes NAV, holdings & protocol positions
                  </p>
                </div>
                <Button onClick={fetch} size="sm">
                  Fetch Portfolio
                </Button>
              </div>
            ) : isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : positions.length > 0 ? (
              <div className="divide-y">
                {positions.map((group, gi) => (
                  <div key={`${group.protocolKey}-${group.chainKey}-${group.positionLabel}-${gi}`} className="py-5 first:pt-0 last:pb-0">
                    {/* Position header */}
                    <div className="mb-2 flex items-center gap-2">
                      {group.protocolImg && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={group.protocolImg} alt={group.protocolName} className="h-5 w-5 rounded-full shrink-0" />
                      )}
                      <span className="font-semibold text-sm">{group.protocolName}</span>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        {group.chainImg && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={group.chainImg} alt={group.chainName} className="h-3.5 w-3.5 rounded-full shrink-0" />
                        )}
                        {group.chainName}
                      </Badge>
                      {group.positionLabel !== "WALLET" && group.positionLabel !== group.protocolName && (
                        <span className="text-xs text-muted-foreground">{group.positionLabel}</span>
                      )}
                      {group.siteUrl && (
                        <a
                          href={group.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open App
                        </a>
                      )}
                      <span className="ml-auto text-sm font-medium">
                        {fmtValue(group.totalValue)}
                      </span>
                    </div>

                    {/* Assets table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Token</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.assets.map((asset, ai) => (
                          <TableRow key={`${asset.symbol}-${asset.contract}-${ai}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {asset.imgSmall && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={asset.imgSmall} alt={asset.symbol.toUpperCase()} className="h-5 w-5 rounded-full shrink-0" />
                                )}
                                <span className="font-medium">{asset.symbol.toUpperCase()}</span>
                                <span className="text-muted-foreground text-xs">{asset.name}</span>
                                {asset.category && (
                                  <Badge variant="secondary" className="text-[9px] px-1 py-0">
                                    {asset.category}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {fmtBalance(asset.balance)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {fmtValue(asset.price)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {fmtValue(asset.value)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No holdings found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
