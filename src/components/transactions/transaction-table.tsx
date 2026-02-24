"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Transaction, TransactionAsset } from "@/types/octav";
import { format } from "date-fns";
import { parseTimestamp } from "@/lib/utils";
import { ExternalLink, ArrowRight, Copy, Check } from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";

function shortenAddress(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function isUserAddress(addr: string) {
  const active = useSettingsStore.getState().activeAddress;
  return active && addr.toLowerCase() === active.toLowerCase();
}

function AddressCell({ address }: { address: string }) {
  const isUser = isUserAddress(address);
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
      {shortenAddress(address)}
      {isUser && (
        <span className="rounded bg-primary/15 px-1 py-0.5 text-[9px] font-semibold text-primary leading-none">
          you
        </span>
      )}
    </span>
  );
}

function fmtBalance(v: string) {
  const n = parseFloat(v);
  if (isNaN(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function fmtFiat(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(n) || n === 0) return "$0.00";
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AssetToken({ asset }: { asset: TransactionAsset }) {
  const value = parseFloat(asset.value);
  return (
    <div className="flex items-center gap-1.5">
      {asset.imgSmall && (
        <img src={asset.imgSmall} alt={asset.symbol.toUpperCase()} className="h-4 w-4 rounded-full shrink-0" />
      )}
      <div>
        <span className="font-mono text-xs">
          {fmtBalance(asset.balance)}{" "}
          <span className="text-muted-foreground">{asset.symbol.toUpperCase()}</span>
        </span>
        {value > 0 && (
          <p className="font-mono text-[10px] text-muted-foreground">{fmtFiat(asset.value)}</p>
        )}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

// --- Detail dialog ---

function TransactionDetailDialog({
  tx,
  open,
  onOpenChange,
}: {
  tx: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!tx) return null;

  const date = format(parseTimestamp(tx.timestamp), "yyyy-MM-dd HH:mm:ss");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Transaction Details
            <Badge variant="outline" className="capitalize">{tx.type}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date & Chain & Protocol */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Chain</p>
              <div className="flex items-center gap-1.5">
                {tx.chain.imgSmall && (
                  <img src={tx.chain.imgSmall} alt={tx.chain.name} className="h-5 w-5 rounded-full" />
                )}
                <p className="font-medium">{tx.chain.name}</p>
              </div>
            </div>
            {tx.protocol.name && (
              <div>
                <p className="text-xs text-muted-foreground">Protocol</p>
                <div className="flex items-center gap-1.5">
                  {tx.protocol.imgSmall && (
                    <img src={tx.protocol.imgSmall} alt={tx.protocol.name} className="h-5 w-5 rounded-full" />
                  )}
                  <p className="font-medium">{tx.protocol.name}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <Badge variant="outline" className="capitalize">{tx.type}</Badge>
            </div>
          </div>

          <Separator />

          {/* From / To */}
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                From
                {isUserAddress(tx.from) && (
                  <span className="rounded bg-primary/15 px-1 py-0.5 text-[9px] font-semibold text-primary leading-none">you</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">{tx.from}</code>
                <CopyButton text={tx.from} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                To
                {isUserAddress(tx.to) && (
                  <span className="rounded bg-primary/15 px-1 py-0.5 text-[9px] font-semibold text-primary leading-none">you</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">{tx.to}</code>
                <CopyButton text={tx.to} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Assets Out */}
          {tx.assetsOut.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Sent</p>
              <div className="space-y-2">
                {tx.assetsOut.map((asset, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-2.5">
                    <div className="flex items-center gap-2">
                      {asset.imgSmall && (
                        <img src={asset.imgSmall} alt={asset.symbol.toUpperCase()} className="h-6 w-6 rounded-full" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{asset.symbol.toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">{asset.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{fmtBalance(asset.balance)}</p>
                      {parseFloat(asset.value) > 0 && (
                        <p className="text-xs text-muted-foreground">{fmtFiat(asset.value)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assets In */}
          {tx.assetsIn.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Received</p>
              <div className="space-y-2">
                {tx.assetsIn.map((asset, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-2.5">
                    <div className="flex items-center gap-2">
                      {asset.imgSmall && (
                        <img src={asset.imgSmall} alt={asset.symbol.toUpperCase()} className="h-6 w-6 rounded-full" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{asset.symbol.toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">{asset.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{fmtBalance(asset.balance)}</p>
                      {parseFloat(asset.value) > 0 && (
                        <p className="text-xs text-muted-foreground">{fmtFiat(asset.value)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Value & Fees */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Fees</p>
              <p className="font-mono font-medium">
                {parseFloat(tx.fees) > 0 ? (
                  <>
                    {parseFloat(tx.fees).toFixed(6)}
                    {parseFloat(tx.feesFiat) > 0 && (
                      <span className="text-muted-foreground text-xs ml-1">({fmtFiat(tx.feesFiat)})</span>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </p>
            </div>
          </div>

          <Separator />

          {/* Hash & Explorer */}
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Transaction Hash</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">{tx.hash}</code>
                <CopyButton text={tx.hash} />
              </div>
            </div>
            {tx.explorerUrl && (
              <a
                href={tx.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                View on Explorer
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Table columns ---

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "timestamp",
    header: "Date",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm">
        {format(parseTimestamp(row.original.timestamp), "yyyy-MM-dd HH:mm")}
      </span>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs capitalize">
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "chain.name",
    header: "Chain",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        {row.original.chain.imgSmall && (
          <img src={row.original.chain.imgSmall} alt={row.original.chain.name} className="h-4 w-4 rounded-full shrink-0" />
        )}
        <span className="text-sm">{row.original.chain.name}</span>
      </div>
    ),
  },
  {
    id: "protocol",
    header: "Protocol",
    cell: ({ row }) => {
      const { name, imgSmall } = row.original.protocol;
      if (!name) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="flex items-center gap-1.5">
          {imgSmall && (
            <img src={imgSmall} alt={name} className="h-4 w-4 rounded-full shrink-0" />
          )}
          <span className="text-sm">{name}</span>
        </div>
      );
    },
  },
  {
    id: "from",
    header: "From",
    cell: ({ row }) => <AddressCell address={row.original.from} />,
  },
  {
    id: "to",
    header: "To",
    cell: ({ row }) => <AddressCell address={row.original.to} />,
  },
  {
    id: "sent",
    header: "Sent",
    cell: ({ row }) => {
      const out = row.original.assetsOut;
      if (out.length === 0) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="space-y-0.5">
          {out.slice(0, 2).map((a, i) => (
            <AssetToken key={i} asset={a} />
          ))}
          {out.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{out.length - 2} more</span>
          )}
        </div>
      );
    },
  },
  {
    id: "received",
    header: "Received",
    cell: ({ row }) => {
      const inp = row.original.assetsIn;
      if (inp.length === 0) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="space-y-0.5">
          {inp.slice(0, 2).map((a, i) => (
            <AssetToken key={i} asset={a} />
          ))}
          {inp.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{inp.length - 2} more</span>
          )}
        </div>
      );
    },
  },
  {
    id: "explorer",
    header: "",
    cell: ({ row }) =>
      row.original.explorerUrl ? (
        <a
          href={row.original.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : null,
  },
];

// --- Main component ---

export function TransactionTable({ data }: { data: Transaction[] }) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedTx(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TransactionDetailDialog
        tx={selectedTx}
        open={!!selectedTx}
        onOpenChange={(open) => !open && setSelectedTx(null)}
      />
    </>
  );
}
