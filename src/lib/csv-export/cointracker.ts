import type { CSVExporter } from "./types";
import type { Transaction } from "@/types/octav";
import { cointrackerDate } from "./date-formats";
import { mapTxType } from "./type-mapping";
import { getNativeToken } from "./chain-native-token";

export const cointrackerExporter: CSVExporter = {
  platform: "cointracker",
  label: "CoinTracker",
  headers: [
    "Date",
    "Received Quantity",
    "Received Currency",
    "Sent Quantity",
    "Sent Currency",
    "Fee Amount",
    "Fee Currency",
    "Tag",
  ],
  mapTransaction: (tx: Transaction) => {
    const rows: string[][] = [];
    const maxLen = Math.max(tx.assetsIn.length, tx.assetsOut.length, 1);

    for (let i = 0; i < maxLen; i++) {
      const out = tx.assetsOut[i];
      const inp = tx.assetsIn[i];
      rows.push([
        cointrackerDate(tx.timestamp),
        inp ? inp.balance : "",
        inp ? inp.symbol : "",
        out ? out.balance : "",
        out ? out.symbol : "",
        i === 0 ? tx.fees : "",
        i === 0 ? getNativeToken(tx.chain.key) : "",
        mapTxType("cointracker", tx.type),
      ]);
    }
    return rows;
  },
};
