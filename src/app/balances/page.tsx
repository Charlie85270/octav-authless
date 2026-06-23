"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DUST_THRESHOLD = 0.000001;

function fmtAmount(n: number) {
  if (n === 0) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function fmtValue(n: number) {
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPrice(p: number | undefined) {
  if (p === undefined) return "—";
  if (p > 0 && p < 0.01) return "$" + p.toPrecision(4);
  return "$" + p.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function BalancesContent() {
  const transactions = useTransactionsStore((s) => s.transactions);
  const activeAddress = useSettingsStore((s) => s.activeAddress);

  const [currentTime, setCurrentTime] = useState(0);
  const [hideDust, setHideDust] = useState(true);

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

  const dustThreshold = hideDust ? DUST_THRESHOLD : 0;

  const { chains: rawChains, hiddenCount } = useMemo(() => {
    const balances = reconstructAt(balanceDeltas, currentTime);
    return groupByChain(balances, balanceDeltas.chainMeta, { dustThreshold });
  }, [balanceDeltas, currentTime, dustThreshold]);

  // Coin ids to price, derived from the debounced snapshot so the query key is
  // stable while actively scrubbing.
  const coinIds = useMemo(() => {
    const balances = reconstructAt(balanceDeltas, debouncedTime);
    const { chains } = groupByChain(balances, balanceDeltas.chainMeta, { dustThreshold });
    return chains.flatMap((c) => c.tokens.map((t) => buildCoinId(t.chainKey, t.contract)));
  }, [balanceDeltas, debouncedTime, dustThreshold]);

  const { prices, isFetching } = useHistoricalPrices(coinIds, debouncedTime);

  // Value each token (live amount × price at the selected day) and roll up.
  const { chains, grandTotal, chainTotals, pricedCount } = useMemo(() => {
    const chainTotals = new Map<string, number>();
    let grandTotal = 0;
    let pricedCount = 0;

    for (const chain of rawChains) {
      let sum = 0;
      for (const token of chain.tokens) {
        const price = prices.get(buildCoinId(token.chainKey, token.contract));
        if (typeof price === "number") {
          sum += token.amount * price;
          pricedCount++;
        }
      }
      chainTotals.set(chain.chainKey, sum);
      grandTotal += sum;
    }

    // Sort chains by value (most valuable first); tokens by value within chain.
    const chains = [...rawChains].sort(
      (a, b) => (chainTotals.get(b.chainKey) ?? 0) - (chainTotals.get(a.chainKey) ?? 0)
    );
    for (const chain of chains) {
      chain.tokens.sort((a, b) => {
        const va = (prices.get(buildCoinId(a.chainKey, a.contract)) ?? 0) * a.amount;
        const vb = (prices.get(buildCoinId(b.chainKey, b.contract)) ?? 0) * b.amount;
        return vb - va;
      });
    }

    return { chains, grandTotal, chainTotals, pricedCount };
  }, [rawChains, prices]);

  const totalTokens = useMemo(
    () => chains.reduce((sum, c) => sum + c.tokens.length, 0),
    [chains]
  );

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
          {isFetching && (
            <span className="text-xs text-muted-foreground">Pricing…</span>
          )}
        </CardContent>
      </Card>

      <BalanceScrubber
        startTime={balanceDeltas.earliest}
        endTime={balanceDeltas.latest}
        currentTime={currentTime}
        hideDust={hideDust}
        onTimeChange={setCurrentTime}
        onHideDustChange={setHideDust}
      />

      {chains.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No holdings at this point in time.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {chains.map((chain) => (
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
                    {chain.tokens.length}{" "}
                    {chain.tokens.length === 1 ? "token" : "tokens"}
                  </Badge>
                  <span className="ml-auto text-sm font-medium tabular-nums">
                    {fmtValue(chainTotals.get(chain.chainKey) ?? 0)}
                  </span>
                </div>

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
                    {chain.tokens.map((token) => {
                      const price = prices.get(buildCoinId(token.chainKey, token.contract));
                      return (
                        <TableRow key={token.key}>
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
                            {fmtPrice(price)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {price === undefined ? "—" : fmtValue(token.amount * price)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Reconstructed from {transactions.length.toLocaleString()} transactions ·{" "}
        {pricedCount}/{totalTokens} tokens priced via DefiLlama
        {hiddenCount > 0 && ` · ${hiddenCount} dust/negative hidden`}. Amounts are
        derived purely from transfer history and assume it is complete starting
        from a zero balance — missing transactions, rebases, or un-emitted rewards
        can cause drift. Tokens without DefiLlama price data are shown with no
        value.
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
