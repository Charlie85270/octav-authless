"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCredits } from "@/hooks/use-octav";
import { Coins } from "lucide-react";

export function CreditBalance() {
  const { data, isLoading, error } = useCredits();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">API Credits</CardTitle>
        <Coins className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : error ? (
          <p className="text-sm text-destructive">Failed to load</p>
        ) : (
          <div className="text-2xl font-bold">{data}</div>
        )}
      </CardContent>
    </Card>
  );
}
