"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStatus, useSyncPortfolio, useSyncTransactions } from "@/hooks/use-octav";
import { useSettingsStore } from "@/stores/settings-store";
import { RefreshCw, Loader2, Info, Database, ArrowLeftRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { parseTimestamp } from "@/lib/utils";

export function SyncStatus() {
  const { data, isLoading, error, isSyncing } = useStatus();
  const syncPortfolio = useSyncPortfolio();
  const syncTx = useSyncTransactions();
  const addressCount = useSettingsStore((s) => s.activeAddress ? 1 : 0);

  function formatSyncDate(value: string | null): string {
    if (!value) return "Never";
    try {
      return formatDistanceToNow(parseTimestamp(value), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Failed to load status</p>
        ) : data && data.length > 0 ? (
          <div className="space-y-3">
            {data.map((entry) => (
              <div key={entry.address} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-muted-foreground">
                    {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                  </p>
                  {entry.syncInProgress && (
                    <Badge variant="default" className="text-[10px] gap-1">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      Syncing...
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Portfolio: </span>
                    <span>{formatSyncDate(entry.portfolioLastSync)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Transactions: </span>
                    <span>{formatSyncDate(entry.transactionsLastSync)}</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Each sync costs{" "}
                  <span className="font-medium text-foreground">
                    {addressCount} credit{addressCount !== 1 ? "s" : ""}
                  </span>{" "}
                  (${(addressCount * 0.025).toFixed(3)})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncPortfolio.mutate()}
                  disabled={syncPortfolio.isPending}
                >
                  {syncPortfolio.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Database className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Sync Portfolio
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncTx.mutate()}
                  disabled={syncTx.isPending || isSyncing}
                >
                  {syncTx.isPending || isSyncing ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {isSyncing ? "Syncing..." : "Sync Txns"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No addresses configured</p>
        )}
      </CardContent>
    </Card>
  );
}
