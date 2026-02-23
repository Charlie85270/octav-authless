"use client";

import { create } from "zustand";
import type { ChatMessage } from "@/types/ai";

interface ChatState {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastMessage: (msg) =>
    set((s) => {
      const updated = [...s.messages];
      updated[updated.length - 1] = msg;
      return { messages: updated };
    }),
  clearMessages: () => set({ messages: [] }),
}));
