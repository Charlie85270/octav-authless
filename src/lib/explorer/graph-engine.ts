import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCollide,
  forceX,
  forceY,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import type { GraphNode, GraphEdge } from "./types";

type SimNode = GraphNode & SimulationNodeDatum;
type SimLink = SimulationLinkDatum<SimNode> & GraphEdge;

export class GraphEngine {
  private simulation: Simulation<SimNode, SimLink> | null = null;
  private _nodes: SimNode[] = [];
  private _links: SimLink[] = [];
  private nodeMap = new Map<string, SimNode>();
  private prevActiveIds = new Set<string>();

  get nodes(): SimNode[] {
    return this._nodes;
  }

  get links(): SimLink[] {
    return this._links;
  }

  initialize(
    nodes: GraphNode[],
    edges: GraphEdge[],
    width: number,
    height: number,
    _onTick: () => void
  ) {
    // Place non-wallet nodes in a random orbit so they don't all start at (0,0)
    this._nodes = nodes.map((n) => {
      const copy = { ...n } as SimNode;
      if (copy.type !== "wallet") {
        const angle = Math.random() * Math.PI * 2;
        const radius = 120 + Math.random() * 150;
        copy.x = Math.cos(angle) * radius;
        copy.y = Math.sin(angle) * radius;
      }
      return copy;
    });

    this.nodeMap = new Map(this._nodes.map((n) => [n.id, n]));

    this._links = edges.map((e) => ({
      ...e,
      source: e.source,
      target: e.target,
    })) as unknown as SimLink[];

    this.simulation = forceSimulation<SimNode>(this._nodes)
      .force("charge", forceManyBody().strength(-200).distanceMax(400))
      .force(
        "link",
        forceLink<SimNode, SimLink>(this._links)
          .id((d) => d.id)
          .distance((d) => {
            const base = 160;
            const scale = Math.max(1, Math.log2((d as SimLink).txCount + 1));
            return base / scale;
          })
          .strength(0.3)
      )
      .force(
        "collide",
        forceCollide<SimNode>()
          .radius((d) => Math.max(d.width, d.height) / 2 + 8)
          .strength(0.5)
      )
      .force("x", forceX(0).strength(0.04))
      .force("y", forceY(0).strength(0.04))
      .alphaDecay(0.03)
      .velocityDecay(0.4)
      .on("tick", () => {});

    // Let it settle quickly
    this.simulation.alpha(0.5).restart();
  }

  /**
   * Called when the set of visible nodes changes.
   * All nodes live in the simulation from the start — no reheat needed.
   */
  updateActiveNodes(_activeIds: Set<string>) {
    // No-op: nodes are already positioned by the simulation.
    // Reheating causes existing nodes to shift, so we skip it entirely.
  }

  dragStart(nodeId: string) {
    if (!this.simulation) return;
    this.simulation.alphaTarget(0.1).restart();
    const node = this.nodeMap.get(nodeId);
    if (node) {
      node.fx = node.x;
      node.fy = node.y;
    }
  }

  dragMove(nodeId: string, x: number, y: number) {
    const node = this.nodeMap.get(nodeId);
    if (node) {
      node.fx = x;
      node.fy = y;
    }
  }

  dragEnd(nodeId: string) {
    if (!this.simulation) return;
    this.simulation.alphaTarget(0);
    const node = this.nodeMap.get(nodeId);
    if (node && node.type !== "wallet") {
      node.fx = null;
      node.fy = null;
    }
  }

  resize(width: number, height: number) {
    // no-op, centering forces handle it
  }

  reheat() {
    this.simulation?.alpha(0.15).restart();
  }

  stop() {
    this.simulation?.stop();
    this.simulation = null;
  }
}
