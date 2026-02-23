import type { CSVExporter } from "./types";
import type { Transaction } from "@/types/octav";
import { cryptoTaxCalcDate } from "./date-formats";
import { mapTxType } from "./type-mapping";
import { getNativeToken } from "./chain-native-token";

export const cryptoTaxCalculatorExporter: CSVExporter = {
  platform: "crypto-tax-calculator",
  label: "Crypto Tax Calculator",
  headers: [
    "Timestamp (UTC)",
    "Type",
    "Base Currency",
    "Base Amount",
    "Quote Currency",
    "Quote Amount",
    "Fee Currency",
    "Fee Amount",
    "From",
    "To",
    "Blockchain",
    "ID",
    "Description",
    "Reference Price Per Unit",
    "Reference Price Currency",
  ],
  mapTransaction: (tx: Transaction) => {
    const rows: string[][] = [];
    const maxLen = Math.max(tx.assetsIn.length, tx.assetsOut.length, 1);

    for (let i = 0; i < maxLen; i++) {
      const inp = tx.assetsIn[i];
      const out = tx.assetsOut[i];
      rows.push([
        cryptoTaxCalcDate(tx.timestamp),
        mapTxType("crypto-tax-calculator", tx.type),
        inp ? inp.symbol : "",
        inp ? inp.balance : "",
        out ? out.symbol : "",
        out ? out.balance : "",
        i === 0 ? getNativeToken(tx.chain.key) : "",
        i === 0 ? tx.fees : "",
        tx.from,
        tx.to,
        tx.chain.name,
        tx.hash,
        tx.protocol.name || "",
        inp ? inp.price : "",
        "USD",
      ]);
    }
    return rows;
  },
};
