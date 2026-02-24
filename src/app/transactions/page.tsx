"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Filters } from "@/components/transactions/filters";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { ExportDialog } from "@/components/transactions/export-dialog";
import { Pagination } from "@/components/transactions/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAllTransactions, useStatus } from "@/hooks/use-octav";
import { useRequireSetup } from "@/hooks/use-require-setup";
import { useSettingsStore } from "@/stores/settings-store";
import { SyncingBanner } from "@/components/syncing-banner";
import { Info, Coins, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const PAGE_SIZE = 250;

export default function TransactionsPage() {
  useRequireSetup();

  const [chain, setChain] = useState("all");
  const [type, setType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const activeAddress = useSettingsStore((s) => s.activeAddress);
  const knownTxCount = useSettingsStore((s) => s.txCountByAddress[s.activeAddress]);

  const { transactions: allTransactions, loading, progress, activated, fetchAll } =
    useAllTransactions();

  const { data: statusData } = useStatus();
  const txLastSync = statusData?.[0]?.transactionsLastSync;
  const neverSynced = !txLastSync;

  // Client-side filtering
  const filteredTransactions = useMemo(() => {
    let result = allTransactions;
    if (chain !== "all") {
      result = result.filter((tx) => tx.chain.key === chain);
    }
    if (type !== "all") {
      result = result.filter((tx) => tx.type === type);
    }
    if (startDate) {
      result = result.filter((tx) => tx.timestamp >= startDate);
    }
    if (endDate) {
      // Include the full end date day
      result = result.filter((tx) => tx.timestamp <= endDate + "T23:59:59");
    }
    return result;
  }, [allTransactions, chain, type, startDate, endDate]);

  // Client-side pagination
  const pageTransactions = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, page]);

  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);
  const hasMore = page < totalPages - 1;

  const filtersDisabled = !activated || loading || allTransactions.length === 0;

  // Estimated cost
  const estimatedPages = knownTxCount ? Math.ceil(knownTxCount / 250) : undefined;
  const estimatedCost = estimatedPages
    ? `~${estimatedPages} credit${estimatedPages !== 1 ? "s" : ""} ($${(estimatedPages * 0.025).toFixed(3)})`
    : undefined;

  const handleLoadClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmLoad = async () => {
    setConfirmOpen(false);
    const result = await fetchAll();
    if (result) {
      toast.success(
        `Loaded ${result.count.toLocaleString()} transactions — cost: ${result.credits} credit${result.credits !== 1 ? "s" : ""} ($${(result.credits * 0.025).toFixed(3)})`
      );
    }
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Transactions</h1>
            <SyncingBanner />
          </div>
          <ExportDialog filters={{
            chain: chain === "all" ? undefined : chain,
            type: type === "all" ? undefined : type,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          }} disabled={!activated || neverSynced} />
        </div>

        {/* Credit cost info banner */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Coins className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">Credit costs for transactions</p>
              <ul className="list-disc list-inside text-muted-foreground text-xs space-y-0.5">
                <li><strong>Fetching transactions:</strong> 1 credit per 250 transactions</li>
                <li><strong>Syncing transactions:</strong> 1 credit + 1 credit per 250 new transactions indexed</li>
                <li><strong>CSV export:</strong> fetches all pages automatically (1 credit per 250-tx page)</li>
              </ul>
            </div>
          </div>
          <div className="flex items-start gap-2 pt-1">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500" />
            <p className="text-xs text-muted-foreground">
              You must sync transactions first from the Dashboard before they appear here.
              Addresses with more than 100,000 transactions are not indexed.
            </p>
          </div>
        </div>

        <Filters
          chain={chain}
          type={type}
          startDate={startDate}
          endDate={endDate}
          disabled={filtersDisabled}
          onChainChange={(v) => { setChain(v); setPage(0); }}
          onTypeChange={(v) => { setType(v); setPage(0); }}
          onStartDateChange={(v) => { setStartDate(v); setPage(0); }}
          onEndDateChange={(v) => { setEndDate(v); setPage(0); }}
        />

        {!activated && neverSynced ? (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Transactions not synced</p>
                <p className="text-xs text-muted-foreground">
                  This address has never been synced. You need to sync your transactions first from the Dashboard before they can be viewed or exported here.
                  Syncing indexes all your on-chain history and costs 1 credit + 1 credit per 250 transactions.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button asChild size="sm">
                <Link href="/dashboard">Go to Dashboard to Sync</Link>
              </Button>
            </div>
          </div>
        ) : !activated && !loading ? (
          <div className="flex items-center justify-between rounded-md bg-muted/50 p-4">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                <p>
                  Loading all transactions costs <span className="font-medium text-foreground">1 credit per 250 txs</span> ($0.025 per page)
                </p>
                {knownTxCount !== undefined && (
                  <p className="text-xs mt-0.5">
                    Last fetch: {knownTxCount.toLocaleString()} transactions — estimated cost: <span className="font-medium text-foreground">{estimatedCost}</span>
                  </p>
                )}
              </div>
            </div>
            <Button onClick={handleLoadClick} size="sm">
              Load All Transactions
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-md bg-muted/50 p-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Fetching transactions... <span className="font-medium text-foreground">{progress.toLocaleString()}</span> loaded
              </p>
            </div>
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredTransactions.length === allTransactions.length
                  ? `${allTransactions.length.toLocaleString()} total transactions`
                  : `${filteredTransactions.length.toLocaleString()} of ${allTransactions.length.toLocaleString()} transactions`}
              </p>
            </div>
            <TransactionTable data={pageTransactions} />
          </>
        )}

        {activated && !loading && filteredTransactions.length > 0 && (
          <Pagination
            offset={page * PAGE_SIZE}
            limit={PAGE_SIZE}
            hasMore={hasMore}
            onPrevious={() => setPage(Math.max(0, page - 1))}
            onNext={() => setPage(page + 1)}
          />
        )}
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load All Transactions</DialogTitle>
            <DialogDescription>
              This will fetch all transactions for your address. Each page of 250 transactions costs 1 credit ($0.025).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {knownTxCount !== undefined ? (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p>
                  Last known count: <span className="font-medium text-foreground">{knownTxCount.toLocaleString()} transactions</span>
                </p>
                <p>
                  Estimated cost: <span className="font-medium text-foreground">{estimatedCost}</span>
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                The transaction count for this address is unknown. Cost depends on the total number of transactions.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmLoad}>
              Confirm & Load
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
