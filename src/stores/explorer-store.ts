"use client";

import { create } from "zustand";
import type { GraphData, TimelineState } from "@/lib/explorer/types";

interface ExplorerState {
  graphData: GraphData | null;
  setGraphData: (data: GraphData | null) => void;

  // Timeline
  timelineState: TimelineState;
  setTimelineState: (state: TimelineState) => void;
  currentTime: number; // timestamp ms
  setCurrentTime: (time: number) => void;
  speed: number; // 1, 2, or 4
  setSpeed: (speed: number) => void;

  // Interaction
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;

  // Density
  nodeDensity: number; // 0-100, percentage of nodes to show
  setNodeDensity: (density: number) => void;
}

export const useExplorerStore = create<ExplorerState>()((set) => ({
  graphData: null,
  setGraphData: (data) => set({ graphData: data }),

  timelineState: "stopped",
  setTimelineState: (state) => set({ timelineState: state }),
  currentTime: 0,
  setCurrentTime: (time) => set({ currentTime: time }),
  speed: 1,
  setSpeed: (speed) => set({ speed }),

  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  hoveredNodeId: null,
  setHoveredNodeId: (id) => set({ hoveredNodeId: id }),

  nodeDensity: 100,
  setNodeDensity: (density) => set({ nodeDensity: density }),
}));
