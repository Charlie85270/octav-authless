import type { CSVExporter } from "./types";
import type { Transaction } from "@/types/octav";
import { tresFinanceDate } from "./date-formats";
import { mapTxType } from "./type-mapping";

// Tres Finance uses a fixed 14-column format:
// Timestamp | Wallet | 3rd Party | Network | Direction | Type | Asset | Amount | Fiat Value | Fiat Currency | Tx Hash
// Direction: "receiver" (inflow) or "sender" (outflow)
// Type: "token_transfer" or "gas"
// Amount is always positive; direction handles sign.

function tresDirection(
  tx: Transaction,
  isOut: boolean
): "sender" | "receiver" {
  if (isOut) return "sender";
  return "receiver";
}

export const tresFinanceExporter: CSVExporter = {
  platform: "tres-finance",
  label: "Tres Finance",
  headers: [
    "Timestamp",
    "Wallet",
    "3rd Party",
    "Network",
    "Direction",
    "Type",
    "Asset",
    "Amount",
    "Fiat Value",
    "Fiat Currency",
    "Tx Hash",
  ],
  mapTransaction: (tx: Transaction) => {
    const rows: string[][] = [];
    const ts = tresFinanceDate(tx.timestamp);
    const wallet = tx.from;
    const network = tx.chain.key || "manual";

    // Outflows
    for (const asset of tx.assetsOut) {
      rows.push([
        ts,
        wallet,
        tx.to,
        network,
        "sender",
        mapTxType("tres-finance", tx.type),
        asset.symbol.toUpperCase(),
        asset.balance,
        asset.value || "",
        "usd",
        tx.hash,
      ]);
    }

    // Inflows
    for (const asset of tx.assetsIn) {
      rows.push([
        ts,
        wallet,
        tx.to,
        network,
        "receiver",
        mapTxType("tres-finance", tx.type),
        asset.symbol.toUpperCase(),
        asset.balance,
        asset.value || "",
        "usd",
        tx.hash,
      ]);
    }

    // Gas fee as separate row
    const fees = parseFloat(tx.fees || "0");
    if (fees > 0) {
      rows.push([
        ts,
        wallet,
        tx.to,
        network,
        "sender",
        "gas",
        "", // native token handled by Tres via network
        tx.fees,
        tx.feesFiat || "",
        "usd",
        tx.hash,
      ]);
    }

    // Fallback: if no assets and no fee, emit one row
    if (rows.length === 0) {
      rows.push([
        ts,
        wallet,
        tx.to,
        network,
        "sender",
        mapTxType("tres-finance", tx.type),
        "",
        "0",
        "",
        "usd",
        tx.hash,
      ]);
    }

    return rows;
  },
};
