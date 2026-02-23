import type { CSVExporter } from "./types";
import type { Transaction } from "@/types/octav";
import { accointingDate } from "./date-formats";
import { mapTxType } from "./type-mapping";
import { getNativeToken } from "./chain-native-token";

export const accointingExporter: CSVExporter = {
  platform: "accointing",
  label: "Accointing",
  headers: [
    "transactionType",
    "date",
    "inBuyAmount",
    "inBuyAsset",
    "outSellAmount",
    "outSellAsset",
    "feeAmount (optional)",
    "feeAsset (optional)",
    "classification (optional)",
    "operationId (optional)",
  ],
  mapTransaction: (tx: Transaction) => {
    const rows: string[][] = [];
    const maxLen = Math.max(tx.assetsIn.length, tx.assetsOut.length, 1);

    for (let i = 0; i < maxLen; i++) {
      const out = tx.assetsOut[i];
      const inp = tx.assetsIn[i];
      rows.push([
        mapTxType("accointing", tx.type),
        accointingDate(tx.timestamp),
        inp ? inp.balance : "",
        inp ? inp.symbol : "",
        out ? out.balance : "",
        out ? out.symbol : "",
        i === 0 ? tx.fees : "",
        i === 0 ? getNativeToken(tx.chain.key) : "",
        tx.type,
        tx.hash,
      ]);
    }
    return rows;
  },
};
