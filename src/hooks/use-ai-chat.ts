"use client";

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ChatMessage } from "@/types/ai";
import type { PortfolioResponse } from "@/types/octav";
import { useSettingsStore } from "@/stores/settings-store";
import { useTransactionsStore } from "@/stores/transactions-store";
import { useChatStore } from "@/stores/chat-store";
import { streamChat, type StreamContext } from "@/lib/ai-client";

export function useAIChat() {
  const { messages, addMessage, updateLastMessage, clearMessages } = useChatStore();
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const { aiProvider, aiApiKey, activeAddress } = useSettingsStore();
  const addresses = activeAddress ? [activeAddress] : [];

  const buildSystemPrompt = useCallback(() => {
    const portfolio = queryClient.getQueryData<PortfolioResponse>(["portfolio", addresses]);
    const transactions = useTransactionsStore.getState().transactions;
    const hasPortfolio = !!portfolio;
    const hasTransactions = transactions.length > 0;

    let prompt =
      "You are a helpful crypto portfolio assistant. You have access to the user's real portfolio data and transaction history loaded below. Use this data to answer questions accurately. Never say you can't access data if it's provided below.\n\n";

    if (!hasPortfolio && !hasTransactions) {
      prompt += "IMPORTANT: No data has been loaded yet. The user needs to go to the Dashboard to load their portfolio, and to the Transactions page to load their transactions before you can answer questions about them. Tell the user this clearly.\n\n";
    } else if (!hasPortfolio) {
      prompt += "NOTE: Portfolio data has NOT been loaded yet. If the user asks about holdings, balances, or portfolio value, tell them to go to the Dashboard and click 'Fetch Portfolio' first.\n\n";
    } else if (!hasTransactions) {
      prompt += "NOTE: Transaction data has NOT been loaded yet. If the user asks about transactions, history, swaps, or transfers, tell them to go to the Transactions page and click 'Load All Transactions' first.\n\n";
    }

    if (activeAddress) {
      prompt += `Wallet: ${activeAddress}\n\n`;
    }

    // Portfolio context from React Query cache
    if (portfolio) {
      const totalNAV = portfolio.reduce((s, e) => s + parseFloat(e.networth || "0"), 0);
      prompt += `## Portfolio (NAV: $${totalNAV.toLocaleString()})\n`;
      for (const entry of portfolio) {
        for (const protocol of Object.values(entry.assetByProtocols)) {
          for (const chain of Object.values(protocol.chains)) {
            for (const [posName, position] of Object.entries(chain.protocolPositions)) {
              if (position.assets.length === 0) continue;
              prompt += `\n### ${protocol.name} — ${chain.name} — ${posName} (Total: $${parseFloat(position.totalValue).toFixed(2)})\n`;
              for (const asset of position.assets) {
                prompt += `- ${asset.symbol.toUpperCase()}: ${parseFloat(asset.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })} ($${parseFloat(asset.value).toFixed(2)}) @ $${parseFloat(asset.price).toFixed(2)}\n`;
              }
            }
          }
        }
      }
      prompt += "\n";
    }

    // All transactions from global store — compact JSON format for token efficiency
    if (hasTransactions) {
      prompt += `## All Transactions (${transactions.length} total)\n\n`;
      const compact = transactions.map((tx) => {
        const ts = Number(tx.timestamp);
        const date = new Date(ts > 1e12 ? ts : ts * 1000).toISOString().slice(0, 19).replace("T", " ");
        const obj: Record<string, unknown> = {
          date,
          type: tx.type,
          chain: tx.chain.name,
          hash: tx.hash,
        };
        if (tx.protocol.name && tx.protocol.name !== "Wallet") obj.protocol = tx.protocol.name;
        if (tx.from) obj.from = tx.from;
        if (tx.to) obj.to = tx.to;
        if (tx.assetsOut.length > 0) {
          obj.sent = tx.assetsOut.map((a) => {
            const r: Record<string, string> = { token: a.symbol.toUpperCase(), amount: a.balance };
            if (parseFloat(a.value) > 0) r.usd = parseFloat(a.value).toFixed(2);
            return r;
          });
        }
        if (tx.assetsIn.length > 0) {
          obj.received = tx.assetsIn.map((a) => {
            const r: Record<string, string> = { token: a.symbol.toUpperCase(), amount: a.balance };
            if (parseFloat(a.value) > 0) r.usd = parseFloat(a.value).toFixed(2);
            return r;
          });
        }
        if (parseFloat(tx.fees) > 0) obj.fee = tx.fees;
        if (parseFloat(tx.feesFiat) > 0) obj.feeUsd = parseFloat(tx.feesFiat).toFixed(2);
        return JSON.stringify(obj);
      });
      prompt += compact.join("\n");
      prompt += "\n";
    }

    return prompt;
  }, [activeAddress, addresses, queryClient]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!aiApiKey || !content.trim()) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      addMessage(userMsg);
      addMessage(assistantMsg);
      setIsStreaming(true);

      try {
        const currentMessages = useChatStore.getState().messages;
        // All messages except the empty assistant placeholder
        const historyForAPI = currentMessages.slice(0, -1);
        const ctx: StreamContext = { usage: null };
        const stream = streamChat(
          {
            provider: aiProvider,
            apiKey: aiApiKey,
            messages: historyForAPI,
            systemPrompt: buildSystemPrompt(),
          },
          ctx
        );

        for await (const chunk of stream) {
          assistantMsg.content += chunk;
          updateLastMessage({ ...assistantMsg });
        }

        if (ctx.usage) {
          assistantMsg.tokenUsage = ctx.usage;
          updateLastMessage({ ...assistantMsg });
        }
      } catch (error) {
        assistantMsg.content =
          error instanceof Error ? `Error: ${error.message}` : "An error occurred.";
        updateLastMessage({ ...assistantMsg });
      } finally {
        setIsStreaming(false);
      }
    },
    [aiProvider, aiApiKey, buildSystemPrompt, addMessage, updateLastMessage]
  );

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    clearMessages();
    setIsStreaming(false);
  }, [clearMessages]);

  return { messages, isStreaming, sendMessage, clearChat, isConfigured: !!aiApiKey };
}
