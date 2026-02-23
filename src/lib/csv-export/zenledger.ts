import type { CSVExporter } from "./types";
import type { Transaction } from "@/types/octav";
import { zenledgerDate } from "./date-formats";
import { mapTxType } from "./type-mapping";
import { getNativeToken } from "./chain-native-token";

export const zenledgerExporter: CSVExporter = {
  platform: "zenledger",
  label: "ZenLedger",
  headers: [
    "Timestamp",
    "Type",
    "In Amount",
    "In Currency",
    "Out Amount",
    "Out Currency",
    "Fee Amount",
    "Fee Currency",
    "Exchange",
    "US Based",
  ],
  mapTransaction: (tx: Transaction) => {
    const rows: string[][] = [];
    const maxLen = Math.max(tx.assetsIn.length, tx.assetsOut.length, 1);

    for (let i = 0; i < maxLen; i++) {
      const out = tx.assetsOut[i];
      const inp = tx.assetsIn[i];
      rows.push([
        zenledgerDate(tx.timestamp),
        mapTxType("zenledger", tx.type),
        inp ? inp.balance : "",
        inp ? inp.symbol : "",
        out ? out.balance : "",
        out ? out.symbol : "",
        i === 0 ? tx.fees : "",
        i === 0 ? getNativeToken(tx.chain.key) : "",
        tx.protocol.name || tx.chain.name,
        "",
      ]);
    }
    return rows;
  },
};
