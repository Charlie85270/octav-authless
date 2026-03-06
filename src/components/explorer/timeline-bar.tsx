"use client";

import { useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { TimelineEngine } from "@/lib/explorer/timeline-engine";
import type { TimelineState } from "@/lib/explorer/types";
import { cn } from "@/lib/utils";

interface TimelineBarProps {
  startTime: number;
  endTime: number;
  currentTime: number;
  timelineState: TimelineState;
  speed: number;
  nodeDensity: number;
  activeNodeCount: number;
  activeTxCount: number;
  onTimeUpdate: (time: number) => void;
  onStateChange: (state: TimelineState) => void;
  onSpeedChange: (speed: number) => void;
  onDensityChange: (density: number) => void;
}

const SPEEDS = [1, 2, 4];

export function TimelineBar({
  startTime,
  endTime,
  currentTime,
  timelineState,
  speed,
  nodeDensity,
  activeNodeCount,
  activeTxCount,
  onTimeUpdate,
  onStateChange,
  onSpeedChange,
  onDensityChange,
}: TimelineBarProps) {
  const engineRef = useRef<TimelineEngine | null>(null);

  // Initialize timeline engine
  useEffect(() => {
    const engine = new TimelineEngine(startTime, endTime, onTimeUpdate, () => {
      onStateChange("stopped");
    });
    engineRef.current = engine;
    return () => engine.destroy();
  }, [startTime, endTime, onTimeUpdate, onStateChange]);

  // Sync speed
  useEffect(() => {
    engineRef.current?.setSpeed(speed);
  }, [speed]);

  // Handle state changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (timelineState === "playing") {
      engine.play();
    } else if (timelineState === "paused") {
      engine.pause();
    } else if (timelineState === "stopped") {
      engine.stop();
    }
  }, [timelineState]);

  const handlePlayPause = useCallback(() => {
    if (timelineState === "playing") {
      onStateChange("paused");
    } else {
      onStateChange("playing");
    }
  }, [timelineState, onStateChange]);

  const handleStop = useCallback(() => {
    onStateChange("stopped");
  }, [onStateChange]);

  const wasPlayingRef = useRef(false);

  const handleSeekStart = useCallback(() => {
    // Pause while scrubbing, remember if we were playing
    wasPlayingRef.current = timelineState === "playing";
    if (timelineState === "playing") {
      engineRef.current?.pause();
    }
  }, [timelineState]);

  const handleSeek = useCallback(
    (value: number[]) => {
      const range = endTime - startTime;
      const time = startTime + (value[0] / 100) * range;
      // Update both engine and store directly for live scrubbing
      engineRef.current?.seek(time);
      onTimeUpdate(time);
    },
    [startTime, endTime, onTimeUpdate]
  );

  const handleSeekEnd = useCallback(() => {
    // Resume playback if we were playing before scrub
    if (wasPlayingRef.current) {
      engineRef.current?.play();
    }
  }, []);

  const progress =
    endTime > startTime
      ? ((currentTime - startTime) / (endTime - startTime)) * 100
      : 0;

  const dateStr =
    currentTime && currentTime > 0 ? format(new Date(currentTime), "MMM d, yyyy") : "—";

  return (
    <div className="flex flex-col gap-2 border-t bg-card px-3 lg:px-4 py-2 lg:py-2.5 shrink-0">
      {/* Top row: slider */}
      <div
        className="w-full"
        onPointerDown={handleSeekStart}
        onPointerUp={handleSeekEnd}
      >
        <Slider
          value={[progress]}
          min={0}
          max={100}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
      </div>

      {/* Bottom row: controls */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Date + stats */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-medium text-foreground">{dateStr}</span>
          <span className="text-[10px] text-muted-foreground">
            {activeNodeCount} peers · {activeTxCount} txs
          </span>
        </div>

        <div className="flex-1" />

        {/* Speed buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {SPEEDS.map((s) => (
            <Button
              key={s}
              variant={speed === s ? "default" : "ghost"}
              size="xs"
              onClick={() => onSpeedChange(s)}
              className="text-xs px-1.5 min-w-[28px]"
            >
              {s}x
            </Button>
          ))}
        </div>

        {/* Play/Pause + Stop */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handlePlayPause}
            title={timelineState === "playing" ? "Pause" : "Play"}
          >
            {timelineState === "playing" ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={handleStop} title="Stop">
            <Square className="h-3 w-3" />
          </Button>
        </div>

        {/* Density slider — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2 min-w-[100px] border-l pl-3 ml-1">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">Nodes</span>
          <Slider
            value={[nodeDensity]}
            min={5}
            max={100}
            step={1}
            onValueChange={(v) => onDensityChange(v[0])}
            className="w-16"
          />
        </div>
      </div>
    </div>
  );
}
