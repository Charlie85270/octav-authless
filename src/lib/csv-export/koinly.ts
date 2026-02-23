import type { CSVExporter } from "./types";
import type { Transaction } from "@/types/octav";
import { koinlyDate } from "./date-formats";
import { mapTxType } from "./type-mapping";
import { getNativeToken } from "./chain-native-token";

export const koinlyExporter: CSVExporter = {
  platform: "koinly",
  label: "Koinly",
  headers: [
    "Date",
    "Sent Amount",
    "Sent Currency",
    "Received Amount",
    "Received Currency",
    "Fee Amount",
    "Fee Currency",
    "Net Worth Amount",
    "Net Worth Currency",
    "Label",
    "Description",
    "TxHash",
  ],
  mapTransaction: (tx: Transaction) => {
    const rows: string[][] = [];
    const maxLen = Math.max(tx.assetsIn.length, tx.assetsOut.length, 1);

    for (let i = 0; i < maxLen; i++) {
      const out = tx.assetsOut[i];
      const inp = tx.assetsIn[i];
      rows.push([
        koinlyDate(tx.timestamp),
        out ? out.balance : "",
        out ? out.symbol : "",
        inp ? inp.balance : "",
        inp ? inp.symbol : "",
        i === 0 ? tx.fees : "",
        i === 0 ? getNativeToken(tx.chain.key) : "",
        i === 0 ? tx.valueFiat : "",
        "USD",
        mapTxType("koinly", tx.type),
        tx.protocol.name || tx.chain.name,
        tx.hash,
      ]);
    }
    return rows;
  },
};
