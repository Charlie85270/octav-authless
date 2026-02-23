import type { Transaction } from "@/types/octav";
import type { CSVExporter, TaxPlatform } from "./types";
import { getTransactions } from "@/lib/octav-client";
import { koinlyExporter } from "./koinly";
import { cointrackerExporter } from "./cointracker";
import { coinledgerExporter } from "./coinledger";
import { taxbitExporter } from "./taxbit";
import { tokentaxExporter } from "./tokentax";
import { accointingExporter } from "./accointing";
import { zenledgerExporter } from "./zenledger";
import { cryptoTaxCalculatorExporter } from "./crypto-tax-calculator";
import { tresFinanceExporter } from "./tres-finance";
import { cryptioExporter } from "./cryptio";

export type { TaxPlatform, CSVExporter } from "./types";

export const exporters: Record<TaxPlatform, CSVExporter> = {
  koinly: koinlyExporter,
  cointracker: cointrackerExporter,
  coinledger: coinledgerExporter,
  taxbit: taxbitExporter,
  tokentax: tokentaxExporter,
  accointing: accointingExporter,
  zenledger: zenledgerExporter,
  "crypto-tax-calculator": cryptoTaxCalculatorExporter,
  "tres-finance": tresFinanceExporter,
  cryptio: cryptioExporter,
};

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCSV(
  exporter: CSVExporter,
  transactions: Transaction[],
  expandMultiAsset: boolean
): string {
  const lines: string[] = [exporter.headers.map(escapeCSV).join(",")];

  for (const tx of transactions) {
    const rows = exporter.mapTransaction(tx);
    if (expandMultiAsset) {
      for (const row of rows) {
        lines.push(row.map(escapeCSV).join(","));
      }
    } else {
      // Only first row per transaction
      if (rows.length > 0) {
        lines.push(rows[0].map(escapeCSV).join(","));
      }
    }
  }

  return lines.join("\n");
}

export async function fetchAllTransactions(
  apiKey: string,
  addresses: string[],
  options: {
    chain?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  } = {},
  onProgress?: (fetched: number) => void
): Promise<Transaction[]> {
  const all: Transaction[] = [];
  const limit = 250;
  let offset = 0;

  while (true) {
    const result = await getTransactions(apiKey, addresses, {
      ...options,
      offset,
      limit,
    });
    all.push(...result.transactions);
    onProgress?.(all.length);

    if (result.transactions.length < limit) break;
    offset += limit;
  }

  return all;
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportToCSV(
  platform: TaxPlatform,
  apiKey: string,
  addresses: string[],
  options: {
    chain?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    expandMultiAsset?: boolean;
  } = {},
  onProgress?: (fetched: number) => void
) {
  const exporter = exporters[platform];
  const transactions = await fetchAllTransactions(
    apiKey,
    addresses,
    options,
    onProgress
  );
  const csv = buildCSV(exporter, transactions, options.expandMultiAsset ?? false);
  const date = new Date().toISOString().split("T")[0];
  downloadCSV(csv, `${exporter.label.toLowerCase().replace(/\s+/g, "-")}-export-${date}.csv`);
  return transactions.length;
}
