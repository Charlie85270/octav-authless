"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSettingsStore } from "@/stores/settings-store";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

const evmRegex = /^0x[a-fA-F0-9]{40}$/;
const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function WalletManager() {
  const { walletAddresses, addWalletAddress, removeWalletAddress } =
    useSettingsStore();
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const addr = input.trim();
    if (!addr) return;
    if (!evmRegex.test(addr) && !solanaRegex.test(addr)) {
      toast.error("Invalid address format");
      return;
    }
    if (walletAddresses.includes(addr)) {
      toast.error("Address already added");
      return;
    }
    addWalletAddress(addr);
    setInput("");
    toast.success("Wallet added");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Addresses</CardTitle>
        <CardDescription>Manage your tracked wallet addresses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="0x... or Solana address"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} size="icon" variant="secondary">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {walletAddresses.length > 0 ? (
          <div className="space-y-2">
            {walletAddresses.map((addr) => (
              <div
                key={addr}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="font-mono text-sm">{addr}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    removeWalletAddress(addr);
                    toast.success("Wallet removed");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No wallets added</p>
        )}
      </CardContent>
    </Card>
  );
}
