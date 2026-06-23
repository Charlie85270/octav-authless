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

function BalancesContent() {
  const transactions = useTransactionsStore((s) => s.transactions);
  const activeAddress = useSettingsStore((s) => s.activeAddress);

  const [currentTime, setCurrentTime] = useState(0);
  const [hideDust, setHideDust] = useState(true);

  const balanceDeltas = useMemo(
    () => buildDeltas(transactions, activeAddress),
    [transactions, activeAddress]
  );

  // Default the scrubber to "now" (latest tx) whenever the data changes.
  useEffect(() => {
    setCurrentTime(balanceDeltas.latest);
  }, [balanceDeltas]);

  const { chains, hiddenCount } = useMemo(() => {
    const balances = reconstructAt(balanceDeltas, currentTime);
    return groupByChain(balances, balanceDeltas.chainMeta, {
      dustThreshold: hideDust ? DUST_THRESHOLD : 0,
    });
  }, [balanceDeltas, currentTime, hideDust]);

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
          Token holdings per chain, reconstructed from transaction history.
        </p>
      </div>

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
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chain.tokens.map((token) => (
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
                        <TableCell
                          className={`text-right font-mono text-sm ${
                            token.amount < 0 ? "text-destructive" : ""
                          }`}
                        >
                          {fmtAmount(token.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Reconstructed from {transactions.length.toLocaleString()} transactions ·{" "}
        {totalTokens} tokens across {chains.length} chains
        {hiddenCount > 0 && ` · ${hiddenCount} dust hidden`}. Amounts are derived
        purely from transfer history and assume it is complete starting from a
        zero balance — tokens held before the first loaded transaction, missing
        transactions, rebases, or un-emitted rewards can cause drift (including
        negative balances).
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
