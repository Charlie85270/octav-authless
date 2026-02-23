"use client";

import { create } from "zustand";
import type { Transaction } from "@/types/octav";

interface TransactionsState {
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
}

export const useTransactionsStore = create<TransactionsState>()((set) => ({
  transactions: [],
  setTransactions: (txs) => set({ transactions: txs }),
}));
