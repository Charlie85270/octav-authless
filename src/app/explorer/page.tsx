"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useTransactionsStore } from "@/stores/transactions-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useExplorerStore } from "@/stores/explorer-store";
import { processTransactions } from "@/lib/explorer/transaction-processor";
import { GraphCanvas } from "@/components/explorer/graph-canvas";
import { TimelineBar } from "@/components/explorer/timeline-bar";
import { CounterpartySidebar } from "@/components/explorer/counterparty-sidebar";
import { NodeDetailPanel } from "@/components/explorer/node-detail-panel";
import { ExplorerHeader } from "@/components/explorer/explorer-header";
import { NodeTooltip } from "@/components/explorer/node-tooltip";
import { ArrowLeftRight, Network, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { StatsDialog } from "@/components/explorer/stats-dialog";
import type { GraphData, GraphNode } from "@/lib/explorer/types";

function ExplorerContent() {
  const transactions = useTransactionsStore((s) => s.transactions);
  const activeAddress = useSettingsStore((s) => s.activeAddress);

  const graphData = useExplorerStore((s) => s.graphData);
  const setGraphData = useExplorerStore((s) => s.setGraphData);
  const timelineState = useExplorerStore((s) => s.timelineState);
  const setTimelineState = useExplorerStore((s) => s.setTimelineState);
  const currentTime = useExplorerStore((s) => s.currentTime);
  const setCurrentTime = useExplorerStore((s) => s.setCurrentTime);
  const speed = useExplorerStore((s) => s.speed);
  const setSpeed = useExplorerStore((s) => s.setSpeed);
  const selectedNodeId = useExplorerStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useExplorerStore((s) => s.setSelectedNodeId);
  const hoveredNodeId = useExplorerStore((s) => s.hoveredNodeId);
  const setHoveredNodeId = useExplorerStore((s) => s.setHoveredNodeId);
  const nodeDensity = useExplorerStore((s) => s.nodeDensity);
  const setNodeDensity = useExplorerStore((s) => s.setNodeDensity);

  // Process transactions into graph data
  useEffect(() => {
    if (transactions.length > 0 && activeAddress) {
      const data = processTransactions(transactions, activeAddress);
      setGraphData(data);
      // Start timeline from the beginning and auto-play
      setCurrentTime(data.stats.earliestTx);
      setTimelineState("playing");
    } else {
      setGraphData(null);
    }
  }, [transactions, activeAddress, setGraphData, setCurrentTime]);

  // Compute active node IDs based on timeline + density
  const activeNodeIds = useMemo(() => {
    if (!graphData) return new Set<string>();

    const ids = new Set<string>();
    ids.add(graphData.walletNodeId); // Wallet always visible

    // Filter nodes by timeline — always respect currentTime so scrubbing works
    const eligibleNodes = graphData.nodes.filter((n) => {
      if (n.id === graphData.walletNodeId) return false;
      return n.firstSeen <= currentTime;
    });

    // Apply density limit
    const maxNodes = Math.max(1, Math.floor((nodeDensity / 100) * eligibleNodes.length));
    // Nodes are already sorted by txCount desc from processor
    for (let i = 0; i < Math.min(maxNodes, eligibleNodes.length); i++) {
      ids.add(eligibleNodes[i].id);
    }

    return ids;
  }, [graphData, timelineState, currentTime, nodeDensity]);

  // Count active transactions
  const activeTxCount = useMemo(() => {
    if (!graphData) return 0;
    let count = 0;
    for (const edge of graphData.edges) {
      if (activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target)) {
        count += edge.txCount;
      }
    }
    return count;
  }, [graphData, activeNodeIds]);

  // Get hovered node for tooltip
  const hoveredNode = useMemo(() => {
    if (!hoveredNodeId || !graphData) return null;
    return graphData.nodes.find((n) => n.id === hoveredNodeId) ?? null;
  }, [hoveredNodeId, graphData]);

  // No transactions loaded
  if (transactions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <ArrowLeftRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">
            No transactions loaded
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Load your transaction history from the Transactions page first, then
            come back here to explore the network graph.
          </p>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Go to Transactions
          </Link>
        </div>
      </div>
    );
  }

  // Mobile view toggle: "graph" or "list"
  const [mobileView, setMobileView] = useState<"graph" | "list">("graph");

  if (!graphData) return null;

  return (
    <>
      <ExplorerHeader graphData={graphData} walletAddress={activeAddress} />

      {/* Mobile view toggle */}
      <div className="flex lg:hidden border-b bg-card px-4 py-1.5 gap-1 shrink-0">
        <Button
          variant={mobileView === "graph" ? "default" : "ghost"}
          size="xs"
          onClick={() => setMobileView("graph")}
          className="text-xs gap-1"
        >
          <Network className="h-3 w-3" />
          Graph
        </Button>
        <Button
          variant={mobileView === "list" ? "default" : "ghost"}
          size="xs"
          onClick={() => setMobileView("list")}
          className="text-xs gap-1"
        >
          <List className="h-3 w-3" />
          List
        </Button>
        <div className="ml-auto">
          <StatsDialog graphData={graphData} transactions={transactions} walletAddress={activeAddress} />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Graph + Timeline — always visible on desktop, toggled on mobile */}
        <div className={`relative flex flex-1 flex-col overflow-hidden ${mobileView === "list" ? "hidden lg:flex" : "flex"}`}>
          <GraphCanvas
            graphData={graphData}
            activeNodeIds={activeNodeIds}
            selectedNodeId={selectedNodeId}
            hoveredNodeId={hoveredNodeId}
            onSelectNode={setSelectedNodeId}
            onHoverNode={setHoveredNodeId}
          />
          <div className="absolute top-3 right-3 z-10 hidden lg:block">
            <StatsDialog graphData={graphData} transactions={transactions} walletAddress={activeAddress} />
          </div>
          <TimelineBar
            startTime={graphData.stats.earliestTx}
            endTime={graphData.stats.latestTx}
            currentTime={currentTime}
            timelineState={timelineState}
            speed={speed}
            nodeDensity={nodeDensity}
            activeNodeCount={activeNodeIds.size - 1}
            activeTxCount={activeTxCount}
            onTimeUpdate={setCurrentTime}
            onStateChange={setTimelineState}
            onSpeedChange={setSpeed}
            onDensityChange={setNodeDensity}
          />
        </div>

        {/* Sidebar — always visible on desktop, toggled on mobile (full width) */}
        <div className={`${mobileView === "graph" ? "hidden lg:block" : "flex-1"} lg:flex-none`}>
          {selectedNodeId && selectedNodeId !== graphData.walletNodeId ? (
            <NodeDetailPanel
              graphData={graphData}
              selectedNodeId={selectedNodeId}
              walletAddress={activeAddress}
              transactions={transactions}
              onBack={() => setSelectedNodeId(null)}
            />
          ) : (
            <CounterpartySidebar
              graphData={graphData}
              activeNodeIds={activeNodeIds}
              selectedNodeId={selectedNodeId}
              hoveredNodeId={hoveredNodeId}
              onSelectNode={setSelectedNodeId}
              onHoverNode={setHoveredNodeId}
            />
          )}
        </div>
      </div>

      <NodeTooltip
        node={hoveredNode}
        canvasRect={null}
        transform={{ x: 0, y: 0, k: 1 }}
      />
    </>
  );
}

export default function ExplorerPage() {
  return (
    <AppShell variant="full">
      <ExplorerContent />
    </AppShell>
  );
}
