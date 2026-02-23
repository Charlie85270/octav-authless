import type { Transaction } from "@/types/octav";

export type TaxPlatform =
  | "koinly"
  | "cointracker"
  | "coinledger"
  | "taxbit"
  | "tokentax"
  | "accointing"
  | "zenledger"
  | "crypto-tax-calculator"
  | "tres-finance"
  | "cryptio";

export interface CSVExporter {
  platform: TaxPlatform;
  label: string;
  headers: string[];
  mapTransaction: (tx: Transaction) => string[][];
}
