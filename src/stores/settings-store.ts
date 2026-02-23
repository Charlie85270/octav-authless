"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIProvider } from "@/types/ai";

interface SettingsState {
  octavApiKey: string;
  walletAddresses: string[];
  activeAddress: string; // single address selected for queries
  aiProvider: AIProvider;
  aiApiKey: string;
  txCountByAddress: Record<string, number>; // address → last known tx count

  setOctavApiKey: (key: string) => void;
  setWalletAddresses: (addresses: string[]) => void;
  addWalletAddress: (address: string) => void;
  removeWalletAddress: (address: string) => void;
  setActiveAddress: (address: string) => void;
  setAIProvider: (provider: AIProvider) => void;
  setAIApiKey: (key: string) => void;
  setTxCount: (address: string, count: number) => void;
  isConfigured: () => boolean;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      octavApiKey: "",
      walletAddresses: [],
      activeAddress: "",
      aiProvider: "openai",
      aiApiKey: "",
      txCountByAddress: {},

      setOctavApiKey: (key) => set({ octavApiKey: key }),
      setWalletAddresses: (addresses) =>
        set({
          walletAddresses: addresses,
          activeAddress: addresses[0] ?? "",
        }),
      addWalletAddress: (address) =>
        set((state) => {
          if (state.walletAddresses.includes(address)) return state;
          const wallets = [...state.walletAddresses, address];
          return {
            walletAddresses: wallets,
            activeAddress: state.activeAddress || address,
          };
        }),
      removeWalletAddress: (address) =>
        set((state) => {
          const wallets = state.walletAddresses.filter((a) => a !== address);
          return {
            walletAddresses: wallets,
            activeAddress:
              state.activeAddress === address
                ? wallets[0] ?? ""
                : state.activeAddress,
          };
        }),
      setActiveAddress: (address) => set({ activeAddress: address }),
      setAIProvider: (provider) => set({ aiProvider: provider }),
      setAIApiKey: (key) => set({ aiApiKey: key }),
      setTxCount: (address, count) =>
        set((state) => ({
          txCountByAddress: { ...state.txCountByAddress, [address]: count },
        })),
      isConfigured: () => {
        const state = get();
        return !!state.octavApiKey && state.walletAddresses.length > 0;
      },
      reset: () =>
        set({
          octavApiKey: "",
          walletAddresses: [],
          activeAddress: "",
          aiProvider: "openai",
          aiApiKey: "",
          txCountByAddress: {},
        }),
    }),
    {
      name: "octav-authless-settings",
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Auto-select first address if none is active
        if (!state.activeAddress && state.walletAddresses.length > 0) {
          state.setActiveAddress(state.walletAddresses[0]);
        }
        // Fix stale activeAddress that no longer exists in wallets
        if (state.activeAddress && !state.walletAddresses.includes(state.activeAddress)) {
          state.setActiveAddress(state.walletAddresses[0] ?? "");
        }
      },
    }
  )
);
