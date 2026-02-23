import type { CSVExporter } from "./types";
import type { Transaction } from "@/types/octav";
import { coinledgerDate } from "./date-formats";
import { mapTxType } from "./type-mapping";
import { getNativeToken } from "./chain-native-token";

export const coinledgerExporter: CSVExporter = {
  platform: "coinledger",
  label: "CoinLedger",
  headers: [
    "Date (UTC)",
    "Platform (Optional)",
    "Asset Sent",
    "Amount Sent",
    "Asset Received",
    "Amount Received",
    "Fee Currency (Optional)",
    "Fee Amount (Optional)",
    "Type",
    "Description (Optional)",
    "TxHash (Optional)",
  ],
  mapTransaction: (tx: Transaction) => {
    const rows: string[][] = [];
    const maxLen = Math.max(tx.assetsIn.length, tx.assetsOut.length, 1);

    for (let i = 0; i < maxLen; i++) {
      const out = tx.assetsOut[i];
      const inp = tx.assetsIn[i];
      rows.push([
        coinledgerDate(tx.timestamp),
        tx.protocol.name || "",
        out ? out.symbol : "",
        out ? out.balance : "",
        inp ? inp.symbol : "",
        inp ? inp.balance : "",
        i === 0 ? getNativeToken(tx.chain.key) : "",
        i === 0 ? tx.fees : "",
        mapTxType("coinledger", tx.type),
        `${tx.chain.name} - ${tx.hash.slice(0, 10)}`,
        tx.hash,
      ]);
    }
    return rows;
  },
};
