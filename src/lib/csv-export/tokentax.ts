import type { CSVExporter } from "./types";
import type { Transaction } from "@/types/octav";
import { tokentaxDate } from "./date-formats";
import { mapTxType } from "./type-mapping";
import { getNativeToken } from "./chain-native-token";

export const tokentaxExporter: CSVExporter = {
  platform: "tokentax",
  label: "TokenTax",
  headers: [
    "Type",
    "BuyAmount",
    "BuyCurrency",
    "SellAmount",
    "SellCurrency",
    "FeeAmount",
    "FeeCurrency",
    "Exchange",
    "Group",
    "Comment",
    "Date",
  ],
  mapTransaction: (tx: Transaction) => {
    const rows: string[][] = [];
    const maxLen = Math.max(tx.assetsIn.length, tx.assetsOut.length, 1);

    for (let i = 0; i < maxLen; i++) {
      const out = tx.assetsOut[i];
      const inp = tx.assetsIn[i];
      rows.push([
        mapTxType("tokentax", tx.type),
        inp ? inp.balance : "",
        inp ? inp.symbol : "",
        out ? out.balance : "",
        out ? out.symbol : "",
        i === 0 ? tx.fees : "",
        i === 0 ? getNativeToken(tx.chain.key) : "",
        tx.protocol.name || tx.chain.name,
        tx.chain.name,
        tx.hash,
        tokentaxDate(tx.timestamp),
      ]);
    }
    return rows;
  },
};
