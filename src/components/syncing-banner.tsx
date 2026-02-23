"use client";

import { useStatus } from "@/hooks/use-octav";
import { Loader2 } from "lucide-react";

export function SyncingBanner() {
  const { isSyncing } = useStatus();

  if (!isSyncing) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">
        Transactions are syncing...
      </span>
    </div>
  );
}
