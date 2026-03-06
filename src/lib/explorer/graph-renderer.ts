import type { GraphNode, GraphEdge } from "./types";

// Colors matching the dark theme
const COLORS = {
  background: "#0b0e14",
  nodeFill: "#131720",
  nodeBorder: "#21262d",
  walletBorder: "#00d4aa",
  walletGlow: "rgba(0, 212, 170, 0.3)",
  selectedBorder: "#3e59c7",
  selectedGlow: "rgba(62, 89, 199, 0.3)",
  hoveredBorder: "#58a6ff",
  inflowEdge: "#00d4aa",
  outflowEdge: "#f85149",
  textPrimary: "#e6edf3",
  textMuted: "#7d8590",
  pnlPositive: "#3fb950",
  pnlNegative: "#f85149",
};

interface Transform {
  x: number;
  y: number;
  k: number; // zoom scale
}

interface SimLink {
  source: { id: string; x: number; y: number } | string;
  target: { id: string; x: number; y: number } | string;
  txCount: number;
  totalValue: number;
  direction: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function getLinkCoords(link: SimLink) {
  const src = typeof link.source === "object" ? link.source : null;
  const tgt = typeof link.target === "object" ? link.target : null;
  if (!src || !tgt) return null;
  return { sx: src.x, sy: src.y, tx: tgt.x, ty: tgt.y };
}

// Animation duration in ms for edge draw + node fade-in
const ANIM_DURATION = 600;

export class GraphRenderer {
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  private dashOffset = 0;
  private _width = 0;
  private _height = 0;
  private imageCache = new Map<string, HTMLImageElement | null>();
  // Track entrance animation per node: startTime (ms) when first appeared
  private animStartTime = new Map<string, number>();
  private prevActiveIds = new Set<string>();

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.dpr = window.devicePixelRatio || 1;
  }

  resize(width: number, height: number) {
    this._width = width;
    this._height = height;
    const canvas = this.ctx.canvas;
    canvas.width = width * this.dpr;
    canvas.height = height * this.dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  private loadImage(url: string): HTMLImageElement | null {
    if (this.imageCache.has(url)) return this.imageCache.get(url)!;
    // Mark as loading (null)
    this.imageCache.set(url, null);
    const img = new Image();
    img.onload = () => {
      this.imageCache.set(url, img);
    };
    img.onerror = () => {
      // Keep null so we don't retry forever
    };
    img.src = url;
    return null;
  }

  render(
    nodes: GraphNode[],
    links: SimLink[],
    transform: Transform,
    activeIds: Set<string>,
    selectedId: string | null,
    hoveredId: string | null,
    walletNodeId?: string
  ) {
    const ctx = this.ctx;
    const dpr = this.dpr;
    const now = performance.now();

    // Detect newly active nodes and start their entrance animation
    for (const id of activeIds) {
      if (!this.prevActiveIds.has(id) && id !== walletNodeId) {
        this.animStartTime.set(id, now);
      }
    }
    // Clean up animations for nodes no longer active
    for (const id of this.prevActiveIds) {
      if (!activeIds.has(id)) {
        this.animStartTime.delete(id);
      }
    }
    this.prevActiveIds = new Set(activeIds);

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, this._width, this._height);

    // Apply camera transform (translate to center, then user transform)
    ctx.translate(this._width / 2 + transform.x, this._height / 2 + transform.y);
    ctx.scale(transform.k, transform.k);

    // Smooth continuous dash animation based on wall clock
    this.dashOffset = (now / 40) % 24;

    // Draw edges first (below nodes)
    for (const link of links) {
      const coords = getLinkCoords(link);
      if (!coords) continue;

      const srcId = typeof link.source === "object" ? link.source.id : link.source;
      const tgtId = typeof link.target === "object" ? link.target.id : link.target;
      if (!activeIds.has(srcId as string) || !activeIds.has(tgtId as string)) continue;

      // Get animation progress for the target node (edge draws toward it)
      const targetAnimStart = this.animStartTime.get(tgtId as string);
      let edgeProgress = 1;
      if (targetAnimStart !== undefined) {
        // Edge draws in the first 60% of the animation
        edgeProgress = Math.min(1, (now - targetAnimStart) / (ANIM_DURATION * 0.6));
        edgeProgress = easeOutCubic(edgeProgress);
      }

      this.drawEdge(ctx, coords, link, edgeProgress);
    }

    // Draw nodes
    for (const node of nodes) {
      if (!activeIds.has(node.id)) continue;
      const isSelected = node.id === selectedId;
      const isHovered = node.id === hoveredId;

      // Get animation progress for node fade-in (starts at 50% of animation)
      const animStart = this.animStartTime.get(node.id);
      let nodeAlpha = 1;
      if (animStart !== undefined) {
        const elapsed = now - animStart;
        // Node fades in during the last 60% of animation (overlapping with edge)
        const fadeStart = ANIM_DURATION * 0.4;
        nodeAlpha = Math.min(1, Math.max(0, (elapsed - fadeStart) / (ANIM_DURATION * 0.6)));
        nodeAlpha = easeOutCubic(nodeAlpha);
        // Clean up finished animations
        if (elapsed >= ANIM_DURATION) {
          this.animStartTime.delete(node.id);
        }
      }

      this.drawNode(ctx, node, isSelected, isHovered, nodeAlpha);
    }

    ctx.restore();
  }

  private drawEdge(
    ctx: CanvasRenderingContext2D,
    coords: { sx: number; sy: number; tx: number; ty: number },
    link: SimLink,
    progress = 1
  ) {
    const { sx, sy, tx, ty } = coords;
    const isOutflow = link.direction === "out";
    const lineWidth = Math.max(1, Math.min(4, Math.log2(link.txCount + 1)));

    // Interpolate endpoint based on animation progress
    const ex = sx + (tx - sx) * progress;
    const ey = sy + (ty - sy) * progress;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);

    ctx.strokeStyle = isOutflow ? COLORS.outflowEdge : COLORS.inflowEdge;
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = 0.5;

    if (isOutflow) {
      ctx.setLineDash([12, 12]);
      ctx.lineDashOffset = -this.dashOffset;
    } else {
      ctx.setLineDash([]);
    }

    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  private drawNode(
    ctx: CanvasRenderingContext2D,
    node: GraphNode,
    isSelected: boolean,
    isHovered: boolean,
    alpha = 1
  ) {
    const x = node.x - node.width / 2;
    const y = node.y - node.height / 2;
    const r = 6; // border radius
    const isWallet = node.type === "wallet";
    const hasImg = !!node.imgUrl;

    // Apply entrance animation alpha
    if (alpha < 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
    }

    // Glow effect for wallet or selected
    if (isWallet || isSelected) {
      ctx.save();
      ctx.shadowBlur = 16;
      ctx.shadowColor = isSelected ? COLORS.selectedGlow : COLORS.walletGlow;
      ctx.fillStyle = COLORS.nodeFill;
      this.roundRect(ctx, x, y, node.width, node.height, r);
      ctx.fill();
      ctx.restore();
    }

    // Node background
    ctx.fillStyle = COLORS.nodeFill;
    this.roundRect(ctx, x, y, node.width, node.height, r);
    ctx.fill();

    // Border
    let borderColor = COLORS.nodeBorder;
    if (isWallet) borderColor = COLORS.walletBorder;
    if (isSelected) borderColor = COLORS.selectedBorder;
    if (isHovered && !isSelected) borderColor = COLORS.hoveredBorder;

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isWallet || isSelected ? 2 : 1;
    this.roundRect(ctx, x, y, node.width, node.height, r);
    ctx.stroke();

    // Layout: if image, draw [icon] [label] centered; else just label centered
    const imgSize = 20;
    const imgPad = 5;
    let textCenterX = node.x;

    if (hasImg) {
      const img = this.loadImage(node.imgUrl!);
      // Shift text right to make room for icon
      textCenterX = node.x + (imgSize + imgPad) / 2;
      const imgX = node.x - node.width / 2 + 8;
      const imgY = node.y - imgSize / 2;

      if (img) {
        // Draw circular clipped image
        ctx.save();
        ctx.beginPath();
        ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
        ctx.restore();
      } else {
        // Placeholder circle while loading
        ctx.fillStyle = COLORS.nodeBorder;
        ctx.beginPath();
        ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Label text
    ctx.fillStyle = COLORS.textPrimary;
    ctx.font = hasImg ? "11px system-ui, sans-serif" : "11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const labelY = hasImg ? node.y - 4 : node.y - 5;
    ctx.fillText(node.label, textCenterX, labelY);

    // Stats line
    const statsText = this.getStatsText(node);
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = "10px system-ui, sans-serif";
    ctx.fillText(statsText, textCenterX, labelY + 14);

    // Restore alpha if entrance animation is active
    if (alpha < 1) {
      ctx.restore();
    }
  }

  private getStatsText(node: GraphNode): string {
    if (node.type === "wallet") {
      return `${node.txCount} txs`;
    }
    const vol = node.volumeIn + node.volumeOut;
    if (vol > 1000) return `${node.txCount}tx · $${(vol / 1000).toFixed(1)}k`;
    if (vol > 0) return `${node.txCount}tx · $${vol.toFixed(0)}`;
    return `${node.txCount} txs`;
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  hitTest(
    nodes: GraphNode[],
    activeIds: Set<string>,
    canvasX: number,
    canvasY: number,
    transform: Transform
  ): GraphNode | null {
    // Convert canvas coords to graph coords
    const graphX = (canvasX - this._width / 2 - transform.x) / transform.k;
    const graphY = (canvasY - this._height / 2 - transform.y) / transform.k;

    // Test in reverse order (top-most first)
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (!activeIds.has(node.id)) continue;

      const nx = node.x - node.width / 2;
      const ny = node.y - node.height / 2;
      if (
        graphX >= nx &&
        graphX <= nx + node.width &&
        graphY >= ny &&
        graphY <= ny + node.height
      ) {
        return node;
      }
    }
    return null;
  }

  canvasToGraph(canvasX: number, canvasY: number, transform: Transform) {
    return {
      x: (canvasX - this._width / 2 - transform.x) / transform.k,
      y: (canvasY - this._height / 2 - transform.y) / transform.k,
    };
  }
}
