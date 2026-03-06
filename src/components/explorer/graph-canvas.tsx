"use client";

import { useRef, useEffect, useCallback } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GraphEngine } from "@/lib/explorer/graph-engine";
import { GraphRenderer } from "@/lib/explorer/graph-renderer";
import type { GraphData, GraphNode } from "@/lib/explorer/types";

interface GraphCanvasProps {
  graphData: GraphData;
  activeNodeIds: Set<string>;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
}

export function GraphCanvas({
  graphData,
  activeNodeIds,
  selectedNodeId,
  hoveredNodeId,
  onSelectNode,
  onHoverNode,
}: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GraphEngine | null>(null);
  const rendererRef = useRef<GraphRenderer | null>(null);
  const rafRef = useRef<number>(0);
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const dragRef = useRef<{
    active: boolean;
    nodeId: string | null;
    startX: number;
    startY: number;
    startTx: number;
    startTy: number;
  }>({ active: false, nodeId: null, startX: 0, startY: 0, startTx: 0, startTy: 0 });

  const activeIdsRef = useRef(activeNodeIds);
  activeIdsRef.current = activeNodeIds;

  const selectedRef = useRef(selectedNodeId);
  selectedRef.current = selectedNodeId;

  const hoveredRef = useRef(hoveredNodeId);
  hoveredRef.current = hoveredNodeId;

  // Render loop
  const renderLoop = useCallback(() => {
    const engine = engineRef.current;
    const renderer = rendererRef.current;
    if (!engine || !renderer) return;

    renderer.render(
      engine.nodes,
      engine.links as never[],
      transformRef.current,
      activeIdsRef.current,
      selectedRef.current,
      hoveredRef.current,
      graphData.walletNodeId
    );

    rafRef.current = requestAnimationFrame(renderLoop);
  }, []);

  // Initialize engine + renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderer = new GraphRenderer(canvas);
    rendererRef.current = renderer;

    const engine = new GraphEngine();
    engineRef.current = engine;

    const rect = container.getBoundingClientRect();
    renderer.resize(rect.width, rect.height);

    engine.initialize(
      graphData.nodes,
      graphData.edges,
      rect.width,
      rect.height,
      () => {} // tick handled by rAF loop
    );

    // Start render loop
    rafRef.current = requestAnimationFrame(renderLoop);

    // ResizeObserver
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        renderer.resize(width, height);
        engine.resize(width, height);
      }
    });
    observer.observe(container);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      engine.stop();
    };
  }, [graphData, renderLoop]);

  // Update active nodes when they change
  useEffect(() => {
    engineRef.current?.updateActiveNodes(activeNodeIds);
  }, [activeNodeIds]);

  // Mouse handlers
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      const engine = engineRef.current;
      if (!canvas || !renderer || !engine) return;

      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      if (dragRef.current.active) {
        const dx = cx - dragRef.current.startX;
        const dy = cy - dragRef.current.startY;

        if (dragRef.current.nodeId) {
          // Dragging a node
          const graphPos = renderer.canvasToGraph(cx, cy, transformRef.current);
          engine.dragMove(dragRef.current.nodeId, graphPos.x, graphPos.y);
        } else {
          // Panning
          transformRef.current = {
            ...transformRef.current,
            x: dragRef.current.startTx + dx,
            y: dragRef.current.startTy + dy,
          };
        }
        return;
      }

      // Hit test for hover
      const hit = renderer.hitTest(
        engine.nodes,
        activeIdsRef.current,
        cx,
        cy,
        transformRef.current
      );
      const newHoveredId = hit?.id ?? null;
      if (newHoveredId !== hoveredRef.current) {
        onHoverNode(newHoveredId);
      }
      canvas.style.cursor = hit ? "pointer" : "default";
    },
    [onHoverNode]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      const engine = engineRef.current;
      if (!canvas || !renderer || !engine) return;

      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      const hit = renderer.hitTest(
        engine.nodes,
        activeIdsRef.current,
        cx,
        cy,
        transformRef.current
      );

      if (hit) {
        dragRef.current = {
          active: true,
          nodeId: hit.id,
          startX: cx,
          startY: cy,
          startTx: transformRef.current.x,
          startTy: transformRef.current.y,
        };
        engine.dragStart(hit.id);
      } else {
        dragRef.current = {
          active: true,
          nodeId: null,
          startX: cx,
          startY: cy,
          startTx: transformRef.current.x,
          startTy: transformRef.current.y,
        };
      }
    },
    []
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const engine = engineRef.current;
      const renderer = rendererRef.current;
      const canvas = canvasRef.current;

      if (dragRef.current.active && dragRef.current.nodeId && engine) {
        // Check if it was a click (no significant movement)
        const rect = canvas?.getBoundingClientRect();
        if (rect) {
          const dx = (e.clientX - rect.left) - dragRef.current.startX;
          const dy = (e.clientY - rect.top) - dragRef.current.startY;
          if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
            // Click — toggle selection
            onSelectNode(
              dragRef.current.nodeId === selectedRef.current
                ? null
                : dragRef.current.nodeId
            );
          }
        }
        engine.dragEnd(dragRef.current.nodeId);
      } else if (dragRef.current.active && !dragRef.current.nodeId) {
        // Check if it was a pan click (no movement = deselect)
        if (canvas && renderer) {
          const rect = canvas.getBoundingClientRect();
          const dx = (e.clientX - rect.left) - dragRef.current.startX;
          const dy = (e.clientY - rect.top) - dragRef.current.startY;
          if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
            onSelectNode(null);
          }
        }
      }

      dragRef.current = {
        active: false,
        nodeId: null,
        startX: 0,
        startY: 0,
        startTx: 0,
        startTy: 0,
      };
    },
    [onSelectNode]
  );

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newK = Math.max(0.1, Math.min(4, transformRef.current.k * delta));

    // Zoom toward mouse position
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;

    const t = transformRef.current;
    transformRef.current = {
      x: mx - (mx - t.x) * (newK / t.k),
      y: my - (my - t.y) * (newK / t.k),
      k: newK,
    };
  }, []);

  const handleZoom = useCallback((direction: "in" | "out") => {
    const factor = direction === "in" ? 1.3 : 0.7;
    const t = transformRef.current;
    const newK = Math.max(0.1, Math.min(4, t.k * factor));
    // Zoom toward center
    transformRef.current = {
      x: t.x * (newK / t.k),
      y: t.y * (newK / t.k),
      k: newK,
    };
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (dragRef.current.active && dragRef.current.nodeId && engineRef.current) {
            engineRef.current.dragEnd(dragRef.current.nodeId);
          }
          dragRef.current = { active: false, nodeId: null, startX: 0, startY: 0, startTx: 0, startTy: 0 };
          onHoverNode(null);
        }}
        onWheel={handleWheel}
      />
      {/* Zoom controls */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1">
        <Button
          variant="secondary"
          size="icon-xs"
          onClick={() => handleZoom("in")}
          title="Zoom in"
          className="bg-card/80 backdrop-blur-sm border border-border"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="icon-xs"
          onClick={() => handleZoom("out")}
          title="Zoom out"
          className="bg-card/80 backdrop-blur-sm border border-border"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
