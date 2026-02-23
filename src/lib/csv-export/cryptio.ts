import type { CSVExporter } from "./types";
import type { Transaction } from "@/types/octav";
import { cryptioDate } from "./date-formats";
import { mapTxType } from "./type-mapping";
import { getNativeToken } from "./chain-native-token";

// Cryptio CSV format:
// date (YYYY-MM-DD HH:MM:SS) | orderType (deposit/withdraw/trade) |
// incomingAsset | incomingVolume | outgoingAsset | outgoingVolume |
// feeAsset | feeVolume | transactionHash | parties | notes
//
// orderType must be lowercase: "deposit", "withdraw", or "trade"
// For trade: both incoming and outgoing must be filled
// For deposit: incoming required
// For withdraw: outgoing required
// Numbers use dot separator only

function cryptioOrderType(tx: Transaction): string {
  const hasIn = tx.assetsIn.length > 0;
  const hasOut = tx.assetsOut.length > 0;
  if (hasIn && hasOut) return "trade";
  if (hasIn) return "deposit";
  if (hasOut) return "withdraw";
  // Fallback to mapped type
  return mapTxType("cryptio", tx.type);
}

export const cryptioExporter: CSVExporter = {
  platform: "cryptio",
  label: "Cryptio",
  headers: [
    "date",
    "orderType",
    "incomingAsset",
    "incomingVolume",
    "outgoingAsset",
    "outgoingVolume",
    "feeAsset",
    "feeVolume",
    "transactionHash",
    "parties",
    "notes",
  ],
  mapTransaction: (tx: Transaction) => {
    const rows: string[][] = [];
    const orderType = cryptioOrderType(tx);
    const maxLen = Math.max(tx.assetsIn.length, tx.assetsOut.length, 1);

    for (let i = 0; i < maxLen; i++) {
      const inp = tx.assetsIn[i];
      const out = tx.assetsOut[i];

      // Determine order type for this specific row
      let rowType = orderType;
      if (i > 0) {
        if (inp && out) rowType = "trade";
        else if (inp) rowType = "deposit";
        else if (out) rowType = "withdraw";
      }

      rows.push([
        cryptioDate(tx.timestamp),
        rowType,
        inp ? inp.symbol : "",
        inp ? inp.balance : "",
        out ? out.symbol : "",
        out ? out.balance : "",
        i === 0 && parseFloat(tx.fees || "0") > 0 ? getNativeToken(tx.chain.key) : "",
        i === 0 && parseFloat(tx.fees || "0") > 0 ? tx.fees : "",
        tx.hash,
        tx.protocol.name || tx.chain.name,
        `${tx.type} on ${tx.chain.name}`,
      ]);
    }
    return rows;
  },
};
