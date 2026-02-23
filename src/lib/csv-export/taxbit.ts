import type { CSVExporter } from "./types";
import type { Transaction } from "@/types/octav";
import { taxbitDate } from "./date-formats";
import { mapTxType } from "./type-mapping";
import { getNativeToken } from "./chain-native-token";

export const taxbitExporter: CSVExporter = {
  platform: "taxbit",
  label: "TaxBit",
  headers: [
    "Date and Time",
    "Transaction Type",
    "Sent Quantity",
    "Sent Currency",
    "Sending Source",
    "Received Quantity",
    "Received Currency",
    "Receiving Destination",
    "Fee",
    "Fee Currency",
    "Exchange Transaction ID",
    "Blockchain Transaction Hash",
  ],
  mapTransaction: (tx: Transaction) => {
    const rows: string[][] = [];
    const maxLen = Math.max(tx.assetsIn.length, tx.assetsOut.length, 1);

    for (let i = 0; i < maxLen; i++) {
      const out = tx.assetsOut[i];
      const inp = tx.assetsIn[i];
      rows.push([
        taxbitDate(tx.timestamp),
        mapTxType("taxbit", tx.type),
        out ? out.balance : "",
        out ? out.symbol : "",
        tx.protocol.name || tx.chain.name,
        inp ? inp.balance : "",
        inp ? inp.symbol : "",
        tx.protocol.name || tx.chain.name,
        i === 0 ? tx.fees : "",
        i === 0 ? getNativeToken(tx.chain.key) : "",
        "",
        tx.hash,
      ]);
    }
    return rows;
  },
};
