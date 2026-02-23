"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSettingsStore } from "@/stores/settings-store";
import { Plus, X, ArrowLeft } from "lucide-react";

const evmRegex = /^0x[a-fA-F0-9]{40}$/;
const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function isValidAddress(addr: string) {
  return evmRegex.test(addr) || solanaRegex.test(addr);
}

export function StepWallets({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { walletAddresses, addWalletAddress, removeWalletAddress } = useSettingsStore();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const addr = input.trim();
    if (!addr) return;
    if (!isValidAddress(addr)) {
      setError("Invalid address. Must be EVM (0x...) or Solana (base58).");
      return;
    }
    if (walletAddresses.includes(addr)) {
      setError("Address already added.");
      return;
    }
    addWalletAddress(addr);
    setInput("");
    setError("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Addresses</CardTitle>
        <CardDescription>Add EVM or Solana wallet addresses to track</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Add Address</Label>
          <div className="flex gap-2">
            <Input
              placeholder="0x... or Solana address"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button size="icon" onClick={handleAdd} variant="secondary">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {walletAddresses.length > 0 && (
          <div className="space-y-2">
            <Label>Added Wallets</Label>
            <div className="flex flex-wrap gap-2">
              {walletAddresses.map((addr) => (
                <Badge key={addr} variant="secondary" className="gap-1 font-mono text-xs">
                  {addr.slice(0, 6)}...{addr.slice(-4)}
                  <button onClick={() => removeWalletAddress(addr)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={onNext} disabled={walletAddresses.length === 0} className="flex-1">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
