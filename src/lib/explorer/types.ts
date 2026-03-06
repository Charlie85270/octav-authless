export type NodeType = "wallet" | "token" | "protocol" | "contract";

export interface GraphNode {
  id: string; // address (lowercase)
  label: string; // truncated address or protocol name
  type: NodeType;
  txCount: number;
  volumeIn: number;
  volumeOut: number;
  netPnl: number;
  firstSeen: number; // timestamp ms
  lastSeen: number;
  chains: Set<string>;

  // Simulation position (mutated by d3-force)
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;

  // Display
  imgUrl: string | null;

  // Rendering dimensions
  width: number;
  height: number;
}

export type EdgeDirection = "in" | "out" | "both";

export interface GraphEdge {
  source: string; // node id
  target: string; // node id
  txCount: number;
  totalValue: number;
  direction: EdgeDirection;
  firstSeen: number;
  lastSeen: number;
}

export interface GraphStats {
  totalTxCount: number;
  totalCounterparties: number;
  totalValueIn: number;
  totalValueOut: number;
  totalFees: number;
  earliestTx: number;
  latestTx: number;
}

export interface TokenEntry {
  id: string; // "token:{symbol}:{chainKey}"
  symbol: string;
  chainKey: string;
  imgUrl: string | null;
  txCount: number;
  volumeIn: number;
  volumeOut: number;
  netPnl: number;
  firstSeen: number;
  lastSeen: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  walletNodeId: string;
  stats: GraphStats;
  chainImages: Record<string, string>; // chainKey → imgSmall URL
  tokens: TokenEntry[]; // sidebar-only token list
}

export type TimelineState = "stopped" | "playing" | "paused";

export interface ExplorerFilters {
  nodeTypes: Set<NodeType>;
  dateRange: [number, number] | null; // [start, end] timestamps
}
