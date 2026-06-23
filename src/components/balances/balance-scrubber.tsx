"use client";

import { useCallback } from "react";
import { format } from "date-fns";
import { SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

// datetime-local <input> value format (local timezone)
const DT_FORMAT = "yyyy-MM-dd'T'HH:mm";

interface BalanceScrubberProps {
  startTime: number;
  endTime: number;
  currentTime: number;
  onTimeChange: (time: number) => void;
}

export function BalanceScrubber({
  startTime,
  endTime,
  currentTime,
  onTimeChange,
}: BalanceScrubberProps) {
  const range = endTime - startTime;
  const progress = range > 0 ? ((currentTime - startTime) / range) * 100 : 100;

  const handleSeek = useCallback(
    (value: number[]) => {
      onTimeChange(startTime + (value[0] / 100) * range);
    },
    [startTime, range, onTimeChange]
  );

  const handlePickDate = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const t = new Date(e.target.value).getTime();
      if (isNaN(t)) return;
      onTimeChange(Math.min(Math.max(t, startTime), endTime));
    },
    [startTime, endTime, onTimeChange]
  );

  const dateStr =
    currentTime > 0 ? format(new Date(currentTime), "MMM d, yyyy · HH:mm") : "—";

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Holdings as of</span>
          <span className="text-lg font-semibold text-foreground">{dateStr}</span>
        </div>
        <Input
          type="datetime-local"
          value={currentTime > 0 ? format(new Date(currentTime), DT_FORMAT) : ""}
          min={startTime > 0 ? format(new Date(startTime), DT_FORMAT) : undefined}
          max={endTime > 0 ? format(new Date(endTime), DT_FORMAT) : undefined}
          onChange={handlePickDate}
          className="w-[210px]"
        />
      </div>

      <Slider
        value={[progress]}
        min={0}
        max={100}
        step={0.05}
        onValueChange={handleSeek}
        className="cursor-pointer"
      />

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onTimeChange(startTime)}
          className="gap-1.5 text-xs"
        >
          <SkipBack className="h-3 w-3" />
          Start
        </Button>
        <span className="text-[10px] text-muted-foreground">
          {startTime > 0 ? format(new Date(startTime), "MMM yyyy") : ""} —{" "}
          {endTime > 0 ? format(new Date(endTime), "MMM yyyy") : ""}
        </span>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onTimeChange(endTime)}
          className="gap-1.5 text-xs"
        >
          Now
          <SkipForward className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
