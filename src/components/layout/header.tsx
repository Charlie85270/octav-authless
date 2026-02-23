"use client";

import { useState } from "react";
import { useCredits } from "@/hooks/use-octav";
import { useSettingsStore } from "@/stores/settings-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Coins, Menu, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { data: credits } = useCredits();
  const { walletAddresses, activeAddress, setActiveAddress, addWalletAddress } =
    useSettingsStore();
  const [open, setOpen] = useState(false);
  const [newAddress, setNewAddress] = useState("");

  const short = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleAdd = () => {
    const addr = newAddress.trim();
    if (!addr) return;
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr) && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) {
      toast.error("Invalid wallet address");
      return;
    }
    if (walletAddresses.includes(addr.toLowerCase())) {
      toast.error("Wallet already added");
      return;
    }
    addWalletAddress(addr);
    setNewAddress("");
    setOpen(false);
    toast.success("Wallet added");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b px-3 sm:px-6 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {/* Mobile hamburger */}
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 shrink-0" onClick={onMenuToggle}>
          <Menu className="h-5 w-5" />
        </Button>

        <Wallet className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
        <Select value={activeAddress} onValueChange={setActiveAddress}>
          <SelectTrigger className="w-[140px] sm:w-[180px] h-8 text-xs font-mono">
            <SelectValue placeholder="Select wallet" />
          </SelectTrigger>
          <SelectContent>
            {walletAddresses.map((addr) => (
              <SelectItem key={addr} value={addr} className="font-mono text-xs">
                {short(addr)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-2">
              <p className="text-sm font-medium">Add Wallet</p>
              <div className="flex gap-2">
                <Input
                  placeholder="0x... or Solana address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="text-xs font-mono h-8"
                />
                <Button size="sm" className="h-8" onClick={handleAdd} disabled={!newAddress.trim()}>
                  Add
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {credits !== undefined && (
        <Badge variant="secondary" className="gap-1.5 shrink-0">
          <Coins className="h-3 w-3" />
          <span className="hidden sm:inline">{credits} credits</span>
          <span className="sm:hidden">{credits}</span>
        </Badge>
      )}
    </header>
  );
}
