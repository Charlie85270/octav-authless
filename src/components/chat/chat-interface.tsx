"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIChat } from "@/hooks/use-ai-chat";
import { Send, Trash2, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatInterface() {
  const { messages, isStreaming, sendMessage, clearChat, isConfigured } =
    useAIChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  if (!isConfigured) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">AI Chat Not Configured</h2>
          <p className="text-sm text-muted-foreground">
            Add an AI API key in Settings to use the chat feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-4">
      {messages.length > 0 && (
        <div className="flex justify-end py-2">
          <Button variant="ghost" size="sm" onClick={clearChat}>
            <Trash2 className="mr-1 h-3 w-3" />
            Clear
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1 pr-2" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <Bot className="mx-auto mb-4 h-8 w-8" />
              <p>Ask about your portfolio, transactions, or tax questions.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                className={cn(
                  "flex gap-3",
                  msg.role === "user" && "justify-end"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2 text-sm overflow-hidden",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content || "..."}</p>
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
              {msg.role === "assistant" && msg.tokenUsage && (
                <p className="ml-11 mt-1 text-[11px] text-muted-foreground">
                  {msg.tokenUsage.input.toLocaleString()} in
                  {msg.tokenUsage.cacheRead ? ` (${msg.tokenUsage.cacheRead.toLocaleString()} cached` +
                    (msg.tokenUsage.cacheCreation ? `, ${msg.tokenUsage.cacheCreation.toLocaleString()} new cache` : "") + ")"
                    : msg.tokenUsage.cacheCreation ? ` (${msg.tokenUsage.cacheCreation.toLocaleString()} new cache)` : ""}
                  {" / "}{msg.tokenUsage.output.toLocaleString()} out
                </p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex gap-2 border-t p-4 -mx-4">
        <Input
          placeholder="Ask about your portfolio..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          disabled={isStreaming}
        />
        <Button onClick={handleSend} disabled={!input.trim() || isStreaming}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
