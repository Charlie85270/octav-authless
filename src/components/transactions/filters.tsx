"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CHAINS = [
  "ethereum", "polygon", "arbitrum", "optimism", "base", "avalanche",
  "bsc", "fantom", "solana", "gnosis", "zksync", "linea", "scroll", "blast",
];

const TX_TYPES = [
  "transfer", "swap", "deposit", "withdraw", "approve", "claim",
  "stake", "unstake", "mint", "burn", "bridge", "borrow", "repay",
  "liquidity-add", "liquidity-remove",
];

interface FiltersProps {
  chain: string;
  type: string;
  startDate: string;
  endDate: string;
  disabled?: boolean;
  onChainChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
}

export function Filters({
  chain,
  type,
  startDate,
  endDate,
  disabled,
  onChainChange,
  onTypeChange,
  onStartDateChange,
  onEndDateChange,
}: FiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1">
        <Label className="text-xs">Chain</Label>
        <Select value={chain} onValueChange={onChainChange} disabled={disabled}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All chains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All chains</SelectItem>
            {CHAINS.map((c) => (
              <SelectItem key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Type</Label>
        <Select value={type} onValueChange={onTypeChange} disabled={disabled}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TX_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.replace("-", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Start Date</Label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-[160px]"
          disabled={disabled}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">End Date</Label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-[160px]"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
