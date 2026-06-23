"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Wallet, ChevronDown, ChevronUp, Download } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { downloadCSV } from "@/lib/csv-export";
import { useTransactionsStore } from "@/stores/transactions-store";
import { useSettingsStore } from "@/stores/settings-store";
import { BalanceScrubber } from "@/components/balances/balance-scrubber";
import {
  buildDeltas,
  reconstructAt,
  groupByChain,
} from "@/lib/balances/reconstruct";
import { buildCoinId } from "@/lib/balances/defillama";
import { useHistoricalPrices } from "@/hooks/use-historical-prices";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Drop negative / float-noise balances in the engine; classify display tiers here.
const NEG_EPSILON = 1e-9;
// Tokens are shown by default only if priced and worth at least this much.
// Below this (incl. dust and unpriced tokens) is hidden behind a per-chain button.
const MIN_VISIBLE_USD = 1;

function fmtAmount(n: number) {
  if (n === 0) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function fmtValue(n: number) {
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPrice(p: number | null) {
  if (p === null) return "—";
  if (p > 0 && p < 0.01) return "$" + p.toPrecision(4);
  return "$" + p.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

interface ValuedToken {
  key: string;
  symbol: string;
  name: string;
  chainKey: string;
  contract: string;
  imgUrl: string | null;
  amount: number;
  price: number | null;
  value: number | null;
}

interface ValuedChain {
  chainName: string;
  visible: ValuedToken[];
  hidden: ValuedToken[];
}

// CSV columns: symbol, name, contract, quantity, price at the time, value, chain.
function buildBalancesCSV(chains: ValuedChain[], dateMs: number): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const dateStr = format(new Date(dateMs), "yyyy-MM-dd HH:mm");
  const lines = [
    ["Symbol", "Name", "Contract", "Quantity", "Price (USD)", "Value (USD)", "Chain", "Date"]
      .map(esc)
      .join(","),
  ];
  for (const chain of chains) {
    for (const t of [...chain.visible, ...chain.hidden]) {
      lines.push(
        [
          t.symbol,
          t.name,
          t.contract || "native",
          t.amount,
          t.price ?? "",
          t.value ?? "",
          chain.chainName,
          dateStr,
        ]
          .map(esc)
          .join(",")
      );
    }
  }
  return lines.join("\n");
}

function BalancesContent() {
  const transactions = useTransactionsStore((s) => s.transactions);
  const activeAddress = useSettingsStore((s) => s.activeAddress);

  const [currentTime, setCurrentTime] = useState(0);
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set());

  // Debounced time drives the (networked) price fetch so scrubbing doesn't spam
  // DefiLlama. Amounts still update live at currentTime.
  const [debouncedTime, setDebouncedTime] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedTime(currentTime), 350);
    return () => clearTimeout(id);
  }, [currentTime]);

  const balanceDeltas = useMemo(
    () => buildDeltas(transactions, activeAddress),
    [transactions, activeAddress]
  );

  // Default the scrubber to "now" (latest tx) whenever the data changes.
  useEffect(() => {
    setCurrentTime(balanceDeltas.latest);
    setDebouncedTime(balanceDeltas.latest);
  }, [balanceDeltas]);

  const rawChains = useMemo(() => {
    const balances = reconstructAt(balanceDeltas, currentTime);
    return groupByChain(balances, balanceDeltas.chainMeta, {
      dustThreshold: NEG_EPSILON,
    }).chains;
  }, [balanceDeltas, currentTime]);

  // Coin ids to price, derived from the debounced snapshot so the query key is
  // stable while actively scrubbing.
  const coinIds = useMemo(() => {
    const balances = reconstructAt(balanceDeltas, debouncedTime);
    const { chains } = groupByChain(balances, balanceDeltas.chainMeta, {
      dustThreshold: NEG_EPSILON,
    });
    return chains.flatMap((c) => c.tokens.map((t) => buildCoinId(t.chainKey, t.contract)));
  }, [balanceDeltas, debouncedTime]);

  const { prices, isFetching } = useHistoricalPrices(coinIds, debouncedTime);

  // Value each token (live amount × price at the selected day), split into the
  // default-visible tier (priced and ≥ $1) vs hidden (dust / sub-$1 / unpriced).
  const { chains, grandTotal, shownCount, hiddenCount } = useMemo(() => {
    const enriched = [];
    let grandTotal = 0;
    let shownCount = 0;
    let hiddenCount = 0;

    for (const chain of rawChains) {
      let total = 0;
      const valued: ValuedToken[] = [];
      for (const t of chain.tokens) {
        const price = prices.get(buildCoinId(t.chainKey, t.contract)) ?? null;
        const value = price !== null ? t.amount * price : null;
        if (value !== null) total += value;
        valued.push({ ...t, price, value });
      }

      const visible = valued.filter((t) => t.value !== null && t.value >= MIN_VISIBLE_USD);
      const hidden = valued.filter((t) => t.value === null || t.value < MIN_VISIBLE_USD);
      visible.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
      hidden.sort((a, b) => (b.value ?? -1) - (a.value ?? -1)); // priced dust above unpriced

      grandTotal += total;
      shownCount += visible.length;
      hiddenCount += hidden.length;
      enriched.push({ ...chain, total, visible, hidden });
    }

    enriched.sort((a, b) => b.total - a.total);
    return { chains: enriched, grandTotal, shownCount, hiddenCount };
  }, [rawChains, prices]);

  const handleExport = () => {
    const csv = buildBalancesCSV(chains, currentTime);
    downloadCSV(csv, `balances-${format(new Date(currentTime), "yyyy-MM-dd")}.csv`);
  };

  const toggleChain = (chainKey: string) => {
    setExpandedChains((prev) => {
      const next = new Set(prev);
      if (next.has(chainKey)) next.delete(chainKey);
      else next.add(chainKey);
      return next;
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="max-w-md text-center">
          <Wallet className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-medium text-foreground">
            No transactions loaded
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Load your transaction history from the Transactions page first, then
            come back here to reconstruct your holdings at any point in time.
          </p>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Wallet className="h-4 w-4" />
            Go to Transactions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Balances</h1>
        <p className="text-sm text-muted-foreground">
          Token holdings and value per chain, reconstructed from transaction
          history and priced at the selected date.
        </p>
      </div>

      {/* Total wallet value */}
      <Card>
        <CardContent className="flex items-baseline justify-between p-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Total wallet value</span>
            <span className="text-3xl font-semibold tabular-nums text-foreground">
              {fmtValue(grandTotal)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isFetching && (
              <span className="text-xs text-muted-foreground">Pricing…</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={chains.length === 0}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <BalanceScrubber
        startTime={balanceDeltas.earliest}
        endTime={balanceDeltas.latest}
        currentTime={currentTime}
        onTimeChange={setCurrentTime}
      />

      {chains.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No holdings at this point in time.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {chains.map((chain) => {
            const expanded = expandedChains.has(chain.chainKey);
            const rows = expanded ? [...chain.visible, ...chain.hidden] : chain.visible;
            return (
              <Card key={chain.chainKey}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    {chain.chainImg && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={chain.chainImg}
                        alt={chain.chainName}
                        className="h-5 w-5 rounded-full"
                      />
                    )}
                    <span className="font-medium capitalize">{chain.chainName}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {chain.visible.length}{" "}
                      {chain.visible.length === 1 ? "token" : "tokens"}
                    </Badge>
                    <span className="ml-auto text-sm font-medium tabular-nums">
                      {fmtValue(chain.total)}
                    </span>
                  </div>

                  {rows.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Token</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((token) => {
                          const isHidden = token.value === null || token.value < MIN_VISIBLE_USD;
                          return (
                            <TableRow
                              key={token.key}
                              className={isHidden ? "text-muted-foreground" : ""}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {token.imgUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={token.imgUrl}
                                      alt={token.symbol.toUpperCase()}
                                      className="h-5 w-5 shrink-0 rounded-full"
                                    />
                                  )}
                                  <span className="font-medium">
                                    {token.symbol.toUpperCase()}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {fmtAmount(token.amount)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                {fmtPrice(token.price)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {token.value === null ? "—" : fmtValue(token.value)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}

                  {chain.hidden.length > 0 && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => toggleChain(chain.chainKey)}
                      className="mt-2 gap-1.5 text-xs text-muted-foreground"
                    >
                      {expanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {expanded
                        ? "Hide dust / unpriced"
                        : `Show ${chain.hidden.length} dust / unpriced`}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Reconstructed from {transactions.length.toLocaleString()} transactions ·{" "}
        {shownCount} tokens shown, {hiddenCount} hidden (dust, sub-$1, or no
        DefiLlama price). Amounts are derived purely from transfer history and
        assume it is complete starting from a zero balance — missing
        transactions, rebases, or un-emitted rewards can cause drift.
      </p>
    </div>
  );
}

export default function BalancesPage() {
  return (
    <AppShell>
      <BalancesContent />
    </AppShell>
  );
}
